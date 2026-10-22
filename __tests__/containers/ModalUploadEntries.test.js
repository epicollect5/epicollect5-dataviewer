jest.mock('axios');

import React from 'react';
import { shallow } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import axios from 'axios';
import reducers from 'reducers';
import ModalUploadEntries from 'containers/ModalUploadEntries';
import PARAMETERS from 'config/parameters';

const FORM_REF = 'form-1';

//the promise library used by the requests util keeps a private reference to the
//real setTimeout, so the fake timers do not flush it: a real wait is needed
const realSetTimeout = setTimeout;
const waitReal = (ms) => new Promise((resolve) => realSetTimeout(resolve, ms));

//run the upload timeouts and then let the promise chain settle
const settle = (times) => {
    let chain = Promise.resolve();
    for (let i = 0; i < (times || 4); i++) {
        chain = chain
            .then(() => {
                jest.runAllTimers();
            })
            .then(() => waitReal(30));
    }
    return chain;
};

//the modal reads the project mapping of the current form, the hierarchy
//navigator and the entries to upload from the store
const getWrapper = (reverseEntries) => {
    const store = createStore(reducers, {
        projectReducer: {
            projectDefinition: {
                project: {
                    slug: 'a-project',
                    forms: []
                }
            },
            projectExtra: {},
            projectMapping: [{ forms: { [FORM_REF]: {} } }]
        },
        navigationReducer: {
            hierarchyNavigator: [{
                formRef: FORM_REF,
                parentEntryUuid: null,
                parentEntryTitle: null
            }],
            currentFormRef: FORM_REF,
            currentBranchRef: null,
            currentBranchOwnerUuid: null,
            currentBranchOwnerEntryTitle: null,
            branchBackLink: null,
            isViewingChildren: false
        },
        modalReducer: {
            entryUuid: null,
            showModalUploadEntries: true,
            uploadTablePageStart: 0,
            uploadTablePageEnd: 0,
            uploadTablePrevBtnEnabled: false,
            uploadTableNextBtnEnabled: false
        },
        tableReducer: {
            reverseEntries,
            filterByFailed: false
        },
        drawerReducer: {
            activeMapping: { map_index: 0 }
        }
    }, applyMiddleware(thunk));

    return shallow(<ModalUploadEntries />, { context: { store } }).dive();
};

describe('(Container) ModalUploadEntries', () => {

    beforeEach(() => {
        //the uploads are chained with a timeout between them
        jest.useFakeTimers();
        axios.post.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should report the entry as failed when the server never answers', () => {
        axios.post.mockReturnValue(Promise.reject(new Error('Network Error')));

        const wrapper = getWrapper([{ an: 'entry' }]);

        return settle().then(() => {
            const failedResponses = wrapper.state('failedResponses');

            expect(failedResponses).toHaveLength(2);
            expect(failedResponses[0].errors[0].source).toBe(PARAMETERS.UPLOAD_ERRORS.CLIENT_SOURCE);
            expect(failedResponses[0].errors[0].code).toBe(PARAMETERS.UPLOAD_ERRORS.CLIENT_CODE);
            expect(failedResponses[0].errors[0].title).toBe(PARAMETERS.LABELS.FILE_UPLOAD_NETWORK_ERROR);
            //the entry is reported as failed, so it can be uploaded again
            expect(wrapper.instance().failedReverseEntries).toEqual([{ an: 'entry' }, { an: 'entry' }]);
        });
    });

    it('should carry on with the next entry after a failure', () => {
        axios.post
            .mockReturnValueOnce(Promise.reject(new Error('Network Error')))
            .mockReturnValueOnce(Promise.resolve({ status: 200, data: { data: { code: 'ec5_357' } } }));

        const wrapper = getWrapper([{ an: 'entry-1' }, { an: 'entry-2' }]);

        return settle().then(() => {
            //the second entry was uploaded, so the upload did not stop
            expect(axios.post).toHaveBeenCalledTimes(2);
            //only the first entry failed
            expect(wrapper.state('failedResponses')).toHaveLength(2);
            expect(wrapper.state('responses')).toHaveLength(4);
        });
    });

    it('should ignore a late failure from a stopped upload', () => {
        let rejectFirstRequest;
        axios.post
            .mockReturnValueOnce(new Promise((resolve, reject) => {
                rejectFirstRequest = reject;
            }))
            .mockReturnValueOnce(Promise.resolve({ status: 200, data: { data: { code: 'ec5_357' } } }));

        const wrapper = getWrapper([{ an: 'entry-1' }]);

        return settle()
            .then(() => {
                //the first entry is being uploaded, its request is still in flight
                expect(axios.post).toHaveBeenCalledTimes(1);

                //the user stops the upload and starts a new one
                wrapper.instance().wasInterruptedUpload = true;
                wrapper.instance().isFirstRun = true;
                wrapper.setProps({});

                return settle();
            })
            .then(() => {
                //the new round uploaded its entry
                expect(axios.post).toHaveBeenCalledTimes(2);
                expect(wrapper.state('responses')).toHaveLength(2);

                //the request of the stopped round fails, late
                rejectFirstRequest(new Error('Network Error'));

                return settle();
            })
            .then(() => {
                //the late failure must not touch the new round
                expect(wrapper.state('failedResponses')).toHaveLength(0);
                expect(wrapper.state('responses')).toHaveLength(2);
                //and it must not start another upload
                expect(axios.post).toHaveBeenCalledTimes(2);
            });
    });

    it('should ignore a late response from a stopped upload', () => {
        let resolveFirstRequest;
        axios.post
            .mockReturnValueOnce(new Promise((resolve) => {
                resolveFirstRequest = resolve;
            }))
            .mockReturnValueOnce(Promise.resolve({ status: 200, data: { data: { code: 'ec5_357' } } }));

        const wrapper = getWrapper([{ an: 'entry-1' }]);

        return settle()
            .then(() => {
                expect(axios.post).toHaveBeenCalledTimes(1);

                //the user stops the upload and starts a new one
                wrapper.instance().wasInterruptedUpload = true;
                wrapper.instance().isFirstRun = true;
                wrapper.setProps({});

                return settle();
            })
            .then(() => {
                expect(axios.post).toHaveBeenCalledTimes(2);
                expect(wrapper.state('responses')).toHaveLength(2);

                //the request of the stopped round answers, late
                resolveFirstRequest({ status: 200, data: { data: { code: 'ec5_357' } } });

                return settle();
            })
            .then(() => {
                //the late response must not touch the new round
                expect(wrapper.state('failedResponses')).toHaveLength(0);
                expect(wrapper.state('responses')).toHaveLength(2);
                //and it must not start another upload
                expect(axios.post).toHaveBeenCalledTimes(2);
            });
    });
});
