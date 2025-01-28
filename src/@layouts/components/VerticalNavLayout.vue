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

      // 👉 Main Content
      const main = h('main', { class: 'layout-page-content' }, 
        h('div', { class: 'page-content-container' }, slots.default?.())
      )

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
        // Background Image Layer
        h('div', {
          class: 'layout-background',
        }),

        // Content Layer
        h('div', { class: 'layout-content-wrapper' }, [
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

  // Background Image Layer
  .layout-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('@/assets/images/component.svg');
    background-size: cover;
    background-position: center;
    //z-index: -1; // Ensures it is behind the content
    opacity: 0.3; // Adjust opacity as needed
  }

  .layout-content-wrapper {
    display: flex;
    z-index: 10;
    flex-direction: column;
    flex-grow: 1;
    min-block-size: 100dvh;
    inline-size: 100vw;
    position: relative; // Ensure content is above the background
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
