const assert = require("node:assert/strict")
const { describe, it } = require("node:test")
const { ExportResultCode } = require("@opentelemetry/core")
const { MultiLogRecordExporter } = require("../build/exporters/multi/multiLogExporter")
const { MultiMetricExporter } = require("../build/exporters/multi/multiMetricExporter")
const { MultiSpanExporter } = require("../build/exporters/multi/multiSpanExporter")

class TestLogExporter extends MultiLogRecordExporter {}
class TestMetricExporter extends MultiMetricExporter {}

const exporters = [
    ["logs", TestLogExporter, [{ body: "test" }]],
    ["metrics", TestMetricExporter, { resource: {}, scopeMetrics: [] }],
    ["spans", MultiSpanExporter, [{ name: "test" }]],
]

function createChild(context) {
    return {
        export: context.mock.fn((payload, callback) => callback({ code: ExportResultCode.SUCCESS })),
        forceFlush: context.mock.fn(async () => {}),
        shutdown: context.mock.fn(async () => {}),
    }
}

function exportAsync(exporter, payload) {
    return new Promise(resolve => exporter.export(payload, resolve))
}

for (const [signal, Exporter, payload] of exporters) {
    describe(`${signal} multi-exporter`, () => {
        it("forwards the original payload to all children and calls back once after all finish", async context => {
            const exporter = new Exporter()
            const completions = []
            const children = Array.from({ length: 3 }, () => ({
                export: context.mock.fn((data, callback) => completions.push(callback)),
            }))
            exporter.add(children[0])
            exporter.add(...children.slice(1))
            const callback = context.mock.fn()
            const completed = new Promise(resolve => exporter.export(payload, result => {
                callback(result)
                resolve(result)
            }))

            for (const child of children) {
                assert.equal(child.export.mock.callCount(), 1)
                assert.equal(child.export.mock.calls[0].arguments[0], payload)
            }
            completions[2]({ code: ExportResultCode.SUCCESS })
            completions[2]({ code: ExportResultCode.SUCCESS })
            completions[0]({ code: ExportResultCode.SUCCESS })
            await new Promise(resolve => setImmediate(resolve))
            assert.equal(callback.mock.callCount(), 0)
            completions[1]({ code: ExportResultCode.SUCCESS })

            assert.deepEqual(await completed, { code: ExportResultCode.SUCCESS })
            await new Promise(resolve => setImmediate(resolve))
            assert.equal(callback.mock.callCount(), 1)
        })

        for (const includeError of [false, true]) {
            it(`reports child export failure ${includeError ? "with" : "without"} an error`, async context => {
                const exporter = new Exporter()
                const failed = createChild(context)
                failed.export.mock.mockImplementation((data, callback) => callback({
                    code: ExportResultCode.FAILED,
                    ...(includeError && { error: new Error("export failed") }),
                }))
                const healthy = createChild(context)
                exporter.add(failed, healthy)

                assert.deepEqual(await exportAsync(exporter, payload), { code: ExportResultCode.FAILED })
                assert.equal(failed.export.mock.callCount(), 1)
                assert.equal(healthy.export.mock.callCount(), 1)
            })
        }

        it("successfully exports with no children", async () => {
            assert.deepEqual(await exportAsync(new Exporter(), payload), { code: ExportResultCode.SUCCESS })
        })

        for (const operation of ["forceFlush", "shutdown"]) {
            it(`${operation} succeeds with no children`, async () => {
                await assert.doesNotReject(new Exporter()[operation]())
            })

            it(`${operation} invokes every child and waits for all successful completions`, async context => {
                const exporter = new Exporter()
                const completions = []
                const children = [createChild(context), createChild(context)]
                for (const child of children) {
                    child[operation].mock.mockImplementation(() => new Promise(resolve => completions.push(resolve)))
                }
                exporter.add(...children)
                let settled = false
                const completed = exporter[operation]().then(() => { settled = true })

                for (const child of children) {
                    assert.equal(child[operation].mock.callCount(), 1)
                }
                completions[1]()
                await new Promise(resolve => setImmediate(resolve))
                assert.equal(settled, false)
                completions[0]()
                await completed
                assert.equal(settled, true)
            })

            for (const failureIndex of [0, 1]) {
                it(`${operation} rejects when child ${failureIndex + 1} fails but still invokes both children`, async context => {
                    const exporter = new Exporter()
                    const failure = new Error(`${operation} failed`)
                    const children = [createChild(context), createChild(context)]
                    children[failureIndex][operation].mock.mockImplementation(async () => { throw failure })
                    exporter.add(...children)

                    await assert.rejects(exporter[operation](), error => {
                        if (signal === "logs" && operation === "forceFlush") {
                            return /forceFlush failed for 1 exporter/.test(error.message)
                        }
                        return error === failure
                    })
                    for (const child of children) {
                        assert.equal(child[operation].mock.callCount(), 1)
                    }
                })
            }
        }

        if (signal === "logs") {
            it("waits for remaining flushes after a failure and counts every failure", async context => {
                const exporter = new Exporter()
                const children = [createChild(context), createChild(context), createChild(context)]
                let finishFlush
                children[0].forceFlush.mock.mockImplementation(async () => { throw new Error("first failure") })
                children[1].forceFlush.mock.mockImplementation(() => new Promise(resolve => { finishFlush = resolve }))
                children[2].forceFlush.mock.mockImplementation(async () => { throw new Error("second failure") })
                exporter.add(...children)
                let settled = false
                const completed = assert.rejects(exporter.forceFlush(), /forceFlush failed for 2 exporter/)
                    .then(() => { settled = true })

                await new Promise(resolve => setImmediate(resolve))
                assert.equal(settled, false)
                finishFlush()
                await completed
            })
        }

        if (signal === "spans") {
            it("flushes children that support forceFlush and tolerates those without it", async context => {
                const exporter = new Exporter()
                const optional = createChild(context)
                delete optional.forceFlush
                const flushable = createChild(context)
                exporter.add(optional, flushable)

                await assert.doesNotReject(exporter.forceFlush())
                assert.equal(flushable.forceFlush.mock.callCount(), 1)
            })
        }
    })
}
