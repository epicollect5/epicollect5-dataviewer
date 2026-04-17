import { config } from '@vue/test-utils';

config.global.stubs = {
  transition: false,
  'ion-app': {
    template: '<div><slot /></div>'
  },
  'ion-content': {
    template: '<div><slot /></div>'
  },
  'ion-header': {
    template: '<header><slot /></header>'
  },
  'ion-toolbar': {
    template: '<div><slot /></div>'
  },
  'ion-title': {
    template: '<div><slot /></div>'
  },
  'ion-buttons': {
    template: '<div><slot /></div>'
  },
  'ion-button': {
    template: '<button><slot /></button>'
  },
  'ion-page': {
    template: '<div><slot /></div>'
  },
  'ion-toast': true,
  'ion-modal': {
    template: '<div><slot /></div>'
  },
  'ag-grid-vue': {
    template: '<div><slot /></div>'
  }
};
