{{!-- Accepts TPatch context --}}

{{#each inputs}}
{{#if isTemplatableCustomTypePin}}
typedef typename TypeOfConstructorNode{{ pinKey }}::Type TypeOf{{ pinKey }};
{{else}}
typedef {{ cppType type }} TypeOf{{ pinKey }};
{{/if}}
{{/each}}
{{!--
  // aliases for output types will be generated after the first portion of user code,
  // where custom output type may be defined.
  // TODO: move all non-self output types here so they can be used to define State or Type?
--}}
