import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import env from '@/core/config/env';
import routes from '@/router/routes';

describe('App', () => {
  it('defaults to the demo project on the dev server', () => {
    expect(env.projectSlug).toBe('');
    expect(env.defaultProjectSlug).toBe('ec5-demo-project');
  });

  it('redirects the root url to the demo project with the slug in the path', async () => {
    expect(routes[0].redirect).toBe('/project/ec5-demo-project/data');

    const router = createRouter({
      history: createMemoryHistory(),
      routes
    });

    await router.push('/');

    expect(router.currentRoute.value.fullPath).toBe('/project/ec5-demo-project/data');
    expect(router.currentRoute.value.params.projectSlug).toBe('ec5-demo-project');
  });

  it('resolves a production-style url to the project route', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes
    });
    const resolved = router.resolve('/project/ec5-demo-project/data');

    expect(resolved.name).toBe('data');
    expect(resolved.params.projectSlug).toBe('ec5-demo-project');
  });

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

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Table placeholder');
  });
});
