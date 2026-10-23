import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import DrawerDownload from '@/components/main/DrawerDownload.vue';
import DrawerNavbarPrimary from '@/components/main/DrawerNavbarPrimary.vue';
import DrawerWrapper from '@/components/main/DrawerWrapper.vue';
import App from '@/App.vue';
import ModalPrepareDownload from '@/components/main/ModalPrepareDownload.vue';
import ModalWrapper from '@/components/main/ModalWrapper.vue';
import NavbarPrimary from '@/components/main/NavbarPrimary.vue';
import NavbarSecondary from '@/components/main/NavbarSecondary.vue';
import NavbarSecondaryLight from '@/components/main/NavbarSecondaryLight.vue';
import OverlayWait from '@/components/main/OverlayWait.vue';
import ToastWrapper from '@/components/main/ToastWrapper.vue';
import DrawerEntry from '@/components/entry/DrawerEntry.vue';
import ModalDeleteEntry from '@/components/entry/ModalDeleteEntry.vue';
import ModalViewEntry from '@/components/entry/ModalViewEntry.vue';
import FormSwitcher from '@/components/forms/FormSwitcher.vue';
import Dropdown from '@/components/global/Dropdown.vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import PlayButton from '@/components/global/PlayButton.vue';
import DrawerMap from '@/components/map/DrawerMap.vue';
import MapProgressBar from '@/components/map/MapProgressBar.vue';
import ModalMediaViewer from '@/components/media/ModalMediaViewer.vue';
import ModalPhotoViewer from '@/components/media/ModalPhotoViewer.vue';
import GridEntries from '@/components/table/GridEntries.vue';
import StateEmptyTable from '@/components/table/StateEmptyTable.vue';
import ToolbarTable from '@/components/table/ToolbarTable.vue';
import GridUpload from '@/components/upload/GridUpload.vue';
import ModalUpload from '@/components/upload/ModalUpload.vue';
import PageData from '@/pages/PageData.vue';
import PageMap from '@/pages/PageMap.vue';
import PageNotFound from '@/pages/PageNotFound.vue';
import PageTable from '@/pages/PageTable.vue';
import routes from '@/router/routes';

const COMPONENTS = [
  ['DrawerDownload', DrawerDownload, {}],
  ['DrawerNavbarPrimary', DrawerNavbarPrimary, {}],
  ['DrawerWrapper', DrawerWrapper, {}],
  ['App', App, {}],
  ['ModalPrepareDownload', ModalPrepareDownload, {}],
  ['ModalWrapper', ModalWrapper, {}],
  ['NavbarPrimary', NavbarPrimary, {}],
  ['NavbarSecondary', NavbarSecondary, {}],
  ['NavbarSecondaryLight', NavbarSecondaryLight, {}],
  ['OverlayWait', OverlayWait, {}],
  ['ToastWrapper', ToastWrapper, {}],
  ['DrawerEntry', DrawerEntry, {}],
  ['ModalDeleteEntry', ModalDeleteEntry, {}],
  ['ModalViewEntry', ModalViewEntry, {}],
  ['FormSwitcher', FormSwitcher, {}],
  ['Dropdown', Dropdown, {}],
  ['LoaderSpinner', LoaderSpinner, {}],
  ['PlayButton', PlayButton, {}],
  ['DrawerMap', DrawerMap, {}],
  ['MapProgressBar', MapProgressBar, {}],
  ['ModalMediaViewer', ModalMediaViewer, {}],
  ['ModalPhotoViewer', ModalPhotoViewer, {}],
  ['GridEntries', GridEntries, {}],
  ['StateEmptyTable', StateEmptyTable, {}],
  ['ToolbarTable', ToolbarTable, {}],
  ['GridUpload', GridUpload, {}],
  ['ModalUpload', ModalUpload, {}],
  ['PageData', PageData, {}],
  ['PageMap', PageMap, {}],
  ['PageNotFound', PageNotFound, {}],
  ['PageTable', PageTable, {}]
];

describe('template bindings resolve', () => {
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    setActivePinia(createPinia());
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  COMPONENTS.forEach(([name, component, props]) => {
    it(`${name} renders without unresolved property warnings`, async () => {
      const router = createRouter({
        history: createMemoryHistory(),
        routes
      });

      await router.push('/project/demo/data');
      await router.isReady();

      mount(component, {
        props,
        global: {
          plugins: [router],
          stubs: {
            LeafletMap: true,
            AgGridVue: true
          }
        }
      });

      const messages = [...warnSpy.mock.calls, ...errorSpy.mock.calls]
        .map((call) => call.map((arg) => String(arg)).join(' '))
        .filter((message) => message.includes('was accessed during render but is not defined'));

      expect(messages).toEqual([]);
    });
  });
});
