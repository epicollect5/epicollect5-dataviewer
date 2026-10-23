import toastReducer from 'reducers/toastReducer';
import PARAMETERS from 'config/parameters';
import {
    TOAST_RESET_STATE,
    TOGGLE_MODAL_DELETE_ENTRY,
    DELETE_ENTRY,
    FILE_UPLOAD_ERROR,
    FILE_DOWNLOAD_ERROR
} from 'config/actions';

const initialState = {
    toastSuccessShow: false,
    toastErrorShow: false,
    toastMessage: null
};

describe('toast reducer test', () => {

    it('should return the initial state for an unknown action', () => {
        const state = toastReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = toastReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    it('should reset the toast state', () => {
        const state = toastReducer({
            ...initialState,
            toastSuccessShow: true,
            toastErrorShow: true,
            toastMessage: 'a message'
        }, {
            type: TOAST_RESET_STATE
        });

        expect(state).toEqual(initialState);
    });

    it('should reset the toast state when the delete entry modal is toggled', () => {
        const state = toastReducer({
            ...initialState,
            toastSuccessShow: true,
            toastErrorShow: true,
            toastMessage: 'a message'
        }, {
            type: TOGGLE_MODAL_DELETE_ENTRY,
            payload: { entryUuid: 'an-uuid', entryTitle: 'a title', entryExtra: {}, rowIndex: 0 }
        });

        expect(state).toEqual(initialState);
    });

    it('should show the success toast when the entry is deleted', () => {
        const state = toastReducer(initialState, {
            type: DELETE_ENTRY + '_FULFILLED'
        });

        expect(state.toastSuccessShow).toBe(true);
        expect(state.toastErrorShow).toBe(false);
        expect(state.toastMessage).toBe(PARAMETERS.LABELS.DELETE_ENTRY_SUCCESS);
    });

    it('should show the error toast when the entry could not be deleted', () => {
        const state = toastReducer(initialState, {
            type: DELETE_ENTRY + '_REJECTED'
        });

        expect(state.toastSuccessShow).toBe(false);
        expect(state.toastErrorShow).toBe(true);
        expect(state.toastMessage).toBe(PARAMETERS.LABELS.DELETE_ENTRY_ERROR);
    });

    it('should show the upload error toast with the given message', () => {
        const state = toastReducer(initialState, {
            type: FILE_UPLOAD_ERROR,
            payload: { message: 'a custom message' }
        });

        expect(state.toastSuccessShow).toBe(false);
        expect(state.toastErrorShow).toBe(true);
        expect(state.toastMessage).toBe('a custom message');
    });

    it('should fall back to the default upload error message', () => {
        const state = toastReducer(initialState, {
            type: FILE_UPLOAD_ERROR,
            payload: {}
        });

        expect(state.toastMessage).toBe(PARAMETERS.LABELS.FILE_UPLOAD_ERROR);
    });

    it('should show the download error toast', () => {
        const state = toastReducer(initialState, {
            type: FILE_DOWNLOAD_ERROR,
            payload: {}
        });

        expect(state.toastSuccessShow).toBe(false);
        expect(state.toastErrorShow).toBe(true);
        expect(state.toastMessage).toBe(PARAMETERS.LABELS.FILE_DOWNLOAD_ERROR);
    });
});
