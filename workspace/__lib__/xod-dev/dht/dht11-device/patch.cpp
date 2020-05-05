
struct State {};

using Type = State*;

static const uint8_t port = constant_value_PORT;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto dev = getState(ctx);
    // just to trigger downstream nodes
    emitValue<output_DEV>(ctx, dev);
}
