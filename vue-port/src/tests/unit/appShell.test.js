import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import Main from '@/components/app/Main.vue';

describe('AppShell', () => {
  it('renders the shell and current route content', async () => {
    setActivePinia(createPinia());

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component: { template: '<div>Table placeholder</div>' }
        }
      ]
    });

    router.push('/');
    await router.isReady();

    const wrapper = mount(Main, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Table placeholder');
  });
});
