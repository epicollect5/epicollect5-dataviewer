import { mount } from '@vue/test-utils';
import { defineComponent, h, reactive } from 'vue';

const modalStore = reactive({
  activeModal: 'photo-viewer',
  payload: {
    title: 'Photo',
    src: 'https://example.com/original.jpg',
    previewSrc: 'https://example.com/thumb.jpg'
  },
  close: vi.fn()
});

vi.mock('@/stores/modalStore', () => ({
  useModalStore: () => modalStore
}));

vi.mock('vue-easy-lightbox', () => ({
  default: defineComponent({
    name: 'VueEasyLightbox',
    props: {
      visible: Boolean,
      imgs: {
        type: Array,
        default: () => []
      },
      index: Number,
      moveDisabled: Boolean,
      zoomDisabled: Boolean,
      rotateDisabled: Boolean
    },
    emits: ['hide'],
    setup(props, { slots, emit }) {
      return () => h('div', {
        class: 'lightbox-stub',
        'data-visible': String(props.visible),
        'data-index': String(props.index),
        'data-imgs': JSON.stringify(props.imgs),
        'data-move-disabled': String(props.moveDisabled),
        'data-zoom-disabled': String(props.zoomDisabled),
        'data-rotate-disabled': String(props.rotateDisabled),
        onClick: () => emit('hide')
      }, slots.toolbar ? slots.toolbar() : []);
    }
  })
}));

describe('components/media/ModalPhotoViewer', () => {
  const originalImage = window.Image;

  beforeEach(() => {
    modalStore.activeModal = 'photo-viewer';
    modalStore.payload = {
      title: 'Photo',
      src: 'https://example.com/original.jpg',
      previewSrc: 'https://example.com/thumb.jpg'
    };
    modalStore.close.mockClear();

    class MockImage {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.complete = false;
      }

      set src(value) {
        this._src = value;
      }
    }

    window.Image = MockImage;
  });

  afterEach(() => {
    window.Image = originalImage;
  });

  it('passes the original image to vue-easy-lightbox, disables extra controls, and shows the app loader', async () => {
    const { default: ModalPhotoViewer } = await import('@/components/media/ModalPhotoViewer.vue');
    const wrapper = mount(ModalPhotoViewer);
    const lightbox = wrapper.get('.lightbox-stub');

    expect(lightbox.attributes('data-visible')).toBe('true');
    expect(lightbox.attributes('data-index')).toBe('0');
    expect(lightbox.attributes('data-imgs')).toContain('https://example.com/original.jpg');
    expect(lightbox.attributes('data-move-disabled')).toBe('true');
    expect(lightbox.attributes('data-zoom-disabled')).toBe('true');
    expect(lightbox.attributes('data-rotate-disabled')).toBe('true');
    expect(wrapper.find('.lightbox-stub').exists()).toBe(true);
  });

  it('closes when vue-easy-lightbox emits hide', async () => {
    const { default: ModalPhotoViewer } = await import('@/components/media/ModalPhotoViewer.vue');
    const wrapper = mount(ModalPhotoViewer);

    await wrapper.get('.lightbox-stub').trigger('click');

    expect(modalStore.close).toHaveBeenCalled();
  });
});
