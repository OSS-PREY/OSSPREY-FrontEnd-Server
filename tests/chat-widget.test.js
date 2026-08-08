// The launcher must survive a close: closing the panel and being unable to
// reopen it strands the user with no way back to the assistant.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

const store = reactive({
  selectedProject: { github_url: 'https://github.com/apache/apex' },
})

vi.mock('@/stores/projectStore', () => ({ useProjectStore: () => store }))
vi.mock('@/utils/apiFetch', () => ({
  apiFetch: vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ project_id: 'p1', answer: 'hi', state: {} }),
  })),
}))
vi.mock('@/utils/apiBase', () => ({ getApiBaseUrl: () => 'http://test' }))

// Stub Vuetify to plain elements so clicks and v-if are observable.
const passthrough = name => ({ name, template: '<div><slot /></div>' })
const STUBS = {
  VCard: passthrough('VCard'),
  VCardTitle: passthrough('VCardTitle'),
  VCardText: passthrough('VCardText'),
  VCardActions: passthrough('VCardActions'),
  VForm: passthrough('VForm'),
  VDivider: passthrough('VDivider'),
  VAvatar: passthrough('VAvatar'),
  VImg: passthrough('VImg'),
  VIcon: passthrough('VIcon'),
  VExpandTransition: passthrough('VExpandTransition'),
  // No explicit $emit: the parent's onClick falls through to the native
  // button, so emitting as well would fire the handler twice and toggle back.
  VBtn: { name: 'VBtn', template: '<button><slot /></button>' },
  VTextarea: {
    name: 'VTextarea',
    props: ['modelValue', 'rows', 'maxRows'],
    template: '<textarea :value="modelValue" :rows="rows" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}

const ChatWidget = () => import('@/components/ChatWidget.vue')

const launcher = w => w.find('.chat-toggle-btn')
const panel = w => w.find('.chatbox')

describe('ChatWidget open/close', () => {
  let wrapper

  beforeEach(async () => {
    const mod = await ChatWidget()
    wrapper = mount(mod.default, { global: { stubs: STUBS } })
  })

  it('starts closed with the launcher visible', () => {
    expect(launcher(wrapper).exists()).toBe(true)
    expect(panel(wrapper).exists()).toBe(false)
  })

  it('opens on the launcher click', async () => {
    await launcher(wrapper).trigger('click')
    expect(panel(wrapper).exists()).toBe(true)
  })

  it('leaves a way back after closing', async () => {
    await launcher(wrapper).trigger('click')
    expect(panel(wrapper).exists()).toBe(true)

    const close = wrapper.findAll('button')
      .find(b => b.attributes('aria-label') === 'Close chat')
    expect(close).toBeTruthy()
    await close.trigger('click')

    expect(panel(wrapper).exists()).toBe(false)
    // The whole point: something must still be clickable to get back in.
    expect(launcher(wrapper).exists()).toBe(true)
  })

  it('reopens after a close', async () => {
    await launcher(wrapper).trigger('click')
    const close = wrapper.findAll('button')
      .find(b => b.attributes('aria-label') === 'Close chat')
    await close.trigger('click')

    await launcher(wrapper).trigger('click')
    expect(panel(wrapper).exists()).toBe(true)
  })
})

describe('ChatWidget input', () => {
  it('is a growing textarea, not a single-line field', async () => {
    const mod = await ChatWidget()
    const wrapper = mount(mod.default, { global: { stubs: STUBS } })
    await launcher(wrapper).trigger('click')

    // A VTextField cannot hold a second line at all.
    expect(wrapper.findComponent({ name: 'VTextarea' }).exists()).toBe(true)
    expect(wrapper.find('.chat-input__field').exists()).toBe(true)
  })

})

// The launcher shared a bottom-anchored flex column with the panel as a plain
// `column`, which put the button above the panel: measured at 1440x640 with a
// full conversation the launcher sat at y=-24, off a position:fixed container
// that cannot be scrolled. column-reverse pins it to the corner instead.
describe('ChatWidget layout invariants', () => {
  it('pins the launcher below the panel and caps the widget height', async () => {
    const { readFileSync } = await import('node:fs')
    // vitest runs from the project root; happy-dom's URL has no file scheme.
    const src = readFileSync('src/components/ChatWidget.vue', 'utf8')

    const widgetRule = src.slice(src.indexOf('.chat-widget {'))
      .slice(0, src.slice(src.indexOf('.chat-widget {')).indexOf('}'))

    expect(widgetRule).toContain('flex-direction: column-reverse')
    expect(widgetRule).toContain('max-block-size')
    // min-block-size:0 is what lets the panel shrink into that cap instead of
    // overflowing it and pushing the close button off screen.
    expect(src).toContain('min-block-size: 0')
  })

  it('renders sent messages with their line breaks intact', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/components/ChatWidget.vue', 'utf8')

    // Without pre-line a multi-line message collapses to one line on send,
    // which would make the textarea pointless.
    expect(src).toContain('white-space: pre-line')
  })
})
