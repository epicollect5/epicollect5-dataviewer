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

        //we use only resolve and we deal with it in the then() callback
        return new Promise((resolve) => {
            axios.post(endpoint, entry)
                .then((response) => {
                    //resolve with response
                    resolve(response);
                })
                .catch((error) => {
                    //resolve with error
                    if (error.response) {
                        resolve(error.response.data);
                    }
                });
        });
    }
};

export default requests;
