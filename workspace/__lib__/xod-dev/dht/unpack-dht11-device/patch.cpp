
struct State {
};

static const uint8_t const_output_OUT = TypeOfConstructorNodeDEV::port;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    // only to trigger evaluation of downstream nodes
    emitValue<output_OUT>(ctx, const_output_OUT);
}
