import { mount } from '@vue/test-utils';
import { reactive } from 'vue';

const modalStore = reactive({
  activeModal: 'media-viewer',
  payload: {
    mediaType: 'audio',
    title: 'Audio',
    src: 'https://example.com/audio.mp3'
  },
  close: vi.fn()
});

vi.mock('@/stores/modalStore', () => ({
  useModalStore: () => modalStore
}));

describe('components/media/ModalMediaViewer', () => {
  beforeEach(() => {
    modalStore.activeModal = 'media-viewer';
    modalStore.payload = {
      mediaType: 'audio',
      title: 'Audio',
      src: 'https://example.com/audio.mp3'
    };
    modalStore.close.mockClear();
  });

  it('renders audio media without photo state handling', async () => {
    const { default: ModalMediaViewer } = await import('@/components/media/ModalMediaViewer.vue');
    const wrapper = mount(ModalMediaViewer);

    expect(wrapper.find('audio').attributes('src')).toBe('https://example.com/audio.mp3');
    expect(wrapper.find('video').exists()).toBe(false);
  });
});
