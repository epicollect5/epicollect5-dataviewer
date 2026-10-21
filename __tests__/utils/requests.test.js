jest.mock('axios');

import axios from 'axios';
import requests from 'utils/requests';
import PARAMETERS from 'config/parameters';

describe('requests utils test', () => {

    let originalFetch;
    const originalIsLocalhost = PARAMETERS.IS_LOCALHOST;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        axios.post.mockReset();
        PARAMETERS.IS_LOCALHOST = originalIsLocalhost;
    });

    describe('performRequest', () => {

        it('should resolve with the parsed json', () => {
            global.fetch = jest.fn(() => Promise.resolve({
                json: () => Promise.resolve({ data: 'a payload' })
            }));

            return requests.performRequest('https://five.epicollect.net/api/internal/project/a-project')
                .then((result) => {
                    expect(global.fetch).toHaveBeenCalledWith('https://five.epicollect.net/api/internal/project/a-project');
                    expect(result).toEqual({ data: 'a payload' });
                });
        });

        it('should reject when the request fails', () => {
            const error = new Error('network down');
            global.fetch = jest.fn(() => Promise.reject(error));

            return requests.performRequest('https://five.epicollect.net/api/internal/project/a-project')
                .then(() => {
                    throw new Error('the request should have been rejected');
                })
                .catch((reason) => {
                    expect(reason).toBe(error);
                });
        });
    });

    describe('uploadOneEntry', () => {

        it('should resolve with the response of a successful upload', () => {
            const response = { status: 200, data: { id: 1 } };
            axios.post.mockReturnValue(Promise.resolve(response));

            return requests.uploadOneEntry({ an: 'entry' }, 'a-project').then((result) => {
                expect(axios.post).toHaveBeenCalled();
                expect(result).toEqual(response);
            });
        });

        it('should use the external endpoint when running on localhost', () => {
            PARAMETERS.IS_LOCALHOST = 1;
            axios.post.mockReturnValue(Promise.resolve({ status: 200 }));

            return requests.uploadOneEntry({ an: 'entry' }, 'a-project').then(() => {
                const expected = PARAMETERS.SERVER_URL + PARAMETERS.API_BULK_UPLOAD_EXTERNAL_ENDPOINT + 'a-project';
                expect(axios.post).toHaveBeenCalledWith(expected, { an: 'entry' });
            });
        });

        it('should use the internal endpoint when not running on localhost', () => {
            PARAMETERS.IS_LOCALHOST = 0;
            axios.post.mockReturnValue(Promise.resolve({ status: 200 }));

            return requests.uploadOneEntry({ an: 'entry' }, 'a-project').then(() => {
                const expected = PARAMETERS.SERVER_URL + PARAMETERS.API_BULK_UPLOAD_INTERNAL_ENDPOINT + 'a-project';
                expect(axios.post).toHaveBeenCalledWith(expected, { an: 'entry' });
            });
        });

        it('should resolve with the error data when the upload fails', () => {
            const error = { response: { status: 500, data: { errors: ['an error'] } } };
            axios.post.mockReturnValue(Promise.reject(error));

            return requests.uploadOneEntry({ an: 'entry' }, 'a-project').then((result) => {
                expect(result).toEqual({ errors: ['an error'] });
            });
        });
    });
});
