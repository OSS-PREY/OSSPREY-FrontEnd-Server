<script>
import { useDisplay } from 'vuetify'

export default defineComponent({
  setup(props, { slots }) {
    const isOverlayNavActive = ref(false)
    const isLayoutOverlayVisible = ref(false)
    const toggleIsOverlayNavActive = useToggle(isOverlayNavActive)
    const route = useRoute()
    const { mdAndDown } = useDisplay()

    syncRef(isOverlayNavActive, isLayoutOverlayVisible)

    return () => {
      // 👉 Navbar
      const navbar = h('header', { class: ['layout-navbar navbar-blur'] }, [
        h('div', { class: 'navbar-content-container d-flex align-center justify-between w-100' }, slots.navbar?.({
          toggleVerticalOverlayNavActive: toggleIsOverlayNavActive,
        })),
      ])

      // 👉 Main Content
      const main = h('main', { class: 'layout-page-content' }, h('div', { class: 'page-content-container' }, slots.default?.()))

      // 👉 Footer
      const footer = h('footer', { class: 'layout-footer' }, [
        h('div', { class: 'footer-content-container' }, slots.footer?.()),
      ])

      // 👉 Overlay
      const layoutOverlay = h('div', {
        class: ['layout-overlay', { visible: isLayoutOverlayVisible.value }],
        onClick: () => { isLayoutOverlayVisible.value = !isLayoutOverlayVisible.value },
      })

      return h('div', {
        class: [
          'layout-wrapper layout-navbar-static layout-footer-static layout-content-width-fluid',
          mdAndDown.value && 'layout-overlay-nav',
          route.meta.layoutWrapperClasses,
        ],
      }, [
        h('div', { class: 'layout-content-wrapper' }, [
          navbar,
          main,
          footer,
        ]),
        layoutOverlay,
      ])
    }
  },
})
</script>

<style lang="scss">
@use "@configured-variables" as variables;
@use "@layouts/styles/placeholders";
@use "@layouts/styles/mixins";

.layout-wrapper {
  inline-size: 100vw;
  block-size: 100%;

  .layout-content-wrapper {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-block-size: 100dvh;
    inline-size: 100vw;
  }

  .layout-navbar {
    z-index: variables.$layout-vertical-nav-layout-navbar-z-index;

    .navbar-content-container {
      block-size: variables.$layout-vertical-nav-navbar-height;
      inline-size: 100vw;
      display: flex;
      justify-content: space-between; 
      align-items: center;
      @include mixins.boxed-content;
    }
  }

  &.layout-navbar-sticky .layout-navbar {
    @extend %layout-navbar-sticky;
  }

  &.layout-navbar-hidden .layout-navbar {
    @extend %layout-navbar-hidden;
  }

  .layout-footer {
    inline-size: 100vw;
    @include mixins.boxed-content;
  }

  .layout-overlay {
    position: fixed;
    z-index: variables.$layout-overlay-z-index;
    background-color: rgb(0 0 0 / 60%);
    cursor: pointer;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease-in-out;
    will-change: opacity;

    &.visible {
      opacity: 1;
      pointer-events: auto;
    }
  }

  &.layout-content-height-fixed {
    .layout-content-wrapper {
      max-block-size: 100dvh;
    }

    .layout-page-content {
      display: flex;
      overflow: hidden;
      inline-size: 100vw;

      .page-content-container {
        inline-size: 100vw;
        padding: 0;

        > :first-child {
          max-block-size: 100%;
          overflow-y: auto;
          inline-size: 100%;
        }
      }
    }
  }
}
</style>
