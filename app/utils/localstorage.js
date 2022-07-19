const localstorage = {
    save(params) {
        try {
            window.localStorage.setItem('epicollect5-restore', JSON.stringify(params));
        } catch (error) {
            console.log(error);
        }
    },
    getRestoreParams() {
        try {
            return JSON.parse(window.localStorage.getItem('epicollect5-restore'));
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    clear() {
        try {
            window.localStorage.removeItem('epicollect5-restore');
        } catch (error) {
            console.log(error);
        }
    }
};

export default localstorage;

