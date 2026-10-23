import { mount } from '@vue/test-utils';
import Dropdown from '@/components/global/Dropdown.vue';

describe('components/global/Dropdown', () => {
  it('anchors the popover to the trigger instead of the clicked child', async () => {
    const wrapper = mount(Dropdown, {
      props: {
        modelValue: 0,
        options: [{ label: 'Default mapping', value: 0 }]
      }
    });

    const trigger = wrapper.get('.dropdown__trigger').element;
    const chevron = wrapper.get('.dropdown__icon').element;
    const clickEvent = {
      currentTarget: trigger,
      target: chevron,
      clientX: 400,
      clientY: 120
    };

    wrapper.vm.openPopover(clickEvent);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.state.isOpen).toBe(true);
    expect(wrapper.vm.state.event.target).toBe(trigger);
  });
});
