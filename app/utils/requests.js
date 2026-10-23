import { Promise } from 'es6-promise';
import axios from 'axios/index';
import PARAMETERS from '../config/parameters';

const requests = {

    performRequest(url) {
        //console.log('request for => ' + url);
        return new Promise((resolve, reject) => {
            //get project data
            fetch(url).then((response) => {
                return response.json();
            }).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        });
    },

    uploadOneEntry(entry, projectSlug) {

        let endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_BULK_UPLOAD_INTERNAL_ENDPOINT + projectSlug;
        if (PARAMETERS.IS_LOCALHOST === 1) {
            //bulk upload endpoint (external) gets disabled in production server
            endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_BULK_UPLOAD_EXTERNAL_ENDPOINT + projectSlug;
        }

        //the server can answer with an error payload, which is resolved with it,
        //but a failure without any response (network error, timeout, dns failure)
        //must reject: otherwise the promise never settles and the upload hangs
        return new Promise((resolve, reject) => {
            axios.post(endpoint, entry)
                .then((response) => {
                    //resolve with response
                    resolve(response);
                })
                .catch((error) => {
                    //the server answered, resolve with the error payload
                    if (error.response) {
                        resolve(error.response.data);
                        return;
                    }
                    //no response at all, reject so the caller can handle it
                    reject(error);
                });
        });
    }
};

export default requests;
