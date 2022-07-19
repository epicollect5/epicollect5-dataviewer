import {
    DELETE_ENTRY,
    TOGGLE_MODAL_DELETE_ENTRY,
    FILE_UPLOAD_ERROR,
    FILE_DOWNLOAD_ERROR,
    TOAST_RESET_STATE
} from 'config/actions';

import PARAMETERS from 'config/parameters';


const initialState = {
    toastSuccessShow: false,
    toastErrorShow: false,
    toastMessage: null
};

export default function toastReducer(state = initialState, action) {

    switch (action.type) {
        case TOAST_RESET_STATE: {
            return {
                toastSuccessShow: false,
                toastErrorShow: false,
                toastMessage: null
            };
        }
        case TOGGLE_MODAL_DELETE_ENTRY: {
            return {
                toastSuccessShow: false,
                toastErrorShow: false,
                toastMessage: null
            };
        }
        case DELETE_ENTRY + '_FULFILLED': {
            return {
                ...state,
                toastSuccessShow: true,
                toastErrorShow: false,
                toastMessage: PARAMETERS.LABELS.DELETE_ENTRY_SUCCESS
            };
        }
        case DELETE_ENTRY + '_REJECTED': {
            return {
                ...state,
                toastSuccessShow: false,
                toastErrorShow: true,
                toastMessage: PARAMETERS.LABELS.DELETE_ENTRY_ERROR
            };
        }
        case FILE_UPLOAD_ERROR: {

            return {
                ...state,
                toastSuccessShow: false,
                toastErrorShow: true,
                toastMessage: action.payload.message || PARAMETERS.LABELS.FILE_UPLOAD_ERROR
            };
        }
        case FILE_DOWNLOAD_ERROR: {
            return {
                ...state,
                toastSuccessShow: false,
                toastErrorShow: true,
                toastMessage: PARAMETERS.LABELS.FILE_DOWNLOAD_ERROR
            };
        }
        default:
            return state;
    }
}
