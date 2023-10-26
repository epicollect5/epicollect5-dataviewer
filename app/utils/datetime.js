import PARAMETERS from 'config/parameters';

const datetime = {

    getFormattedDate: (inputDate, theFormat) => {

        if (inputDate === '') {
            return '';
        }

        const date = inputDate.split('T');
        const dateParts = date[0].split('-');
        const format = theFormat;
        const day = dateParts[2];
        const month = dateParts[1];
        const year = dateParts[0];
        let formattedDate = '';

        switch (format) {
            case PARAMETERS.DATE_FORMAT_1:
                //'dd/MM/YYYY',
                formattedDate = day + '/' + month + '/' + year;
                break;
            case PARAMETERS.DATE_FORMAT_2:
                //'MM/dd/YYYY',
                formattedDate = month + '/' + day + '/' + year;
                break;
            case PARAMETERS.DATE_FORMAT_3:
                formattedDate = year + '/' + month + '/' + day;
                //'YYYY/MM/dd',
                break;
            case PARAMETERS.DATE_FORMAT_4:
                //'MM/YYYY',
                formattedDate = month + '/' + year;
                break;
            case PARAMETERS.DATE_FORMAT_5:
                //'dd/MM',
                formattedDate = day + '/' + month;
                break;
        }
        return formattedDate;
    },

    /**
     *
     * @param inputDate
     * @param theFormat
     * @returns {string}
     */
    getFormattedTime: (inputDate, theFormat) => {

        if (inputDate === '' || theFormat === '') {
            return '';
        }

        const date = inputDate.split('T');
        const timeParts = date[1].split(':');
        const secondsPart = timeParts[timeParts.length - 1].split('.');
        const format = theFormat;
        const hours24 = timeParts[0];
        const minutes = timeParts[1];
        const seconds = secondsPart[0];
        let formattedTime = '';
        let hours12;

        //convert 24 format to 12 format
        if (parseInt(hours24, 10) > 12) {
            hours12 = ((parseInt(hours24, 10) + 11) % 12) + 1;
            //prepend zero when needed
            hours12 = hours12 < 10 ? '0' + hours12.toString() : hours12;
        } else {
            hours12 = hours24;
        }

        switch (format) {
            case PARAMETERS.TIME_FORMAT_1:
                //HH:mm:ss (24 hrs format)
                formattedTime = hours24 + ':' + minutes + ':' + seconds;
                break;
            case PARAMETERS.TIME_FORMAT_2:
                //hh:mm:ss (12 hrs format)
                formattedTime = hours12 + ':' + minutes + ':' + seconds;
                break;
            case PARAMETERS.TIME_FORMAT_3:
                //HH:mm (24hrs format)
                formattedTime = hours24 + ':' + minutes;
                break;
            case PARAMETERS.TIME_FORMAT_4:
                //hh:mm (12 hrs format)
                formattedTime = hours12 + ':' + minutes;
                break;
            case PARAMETERS.TIME_FORMAT_5:
                //mm:ss
                formattedTime = minutes + ':' + seconds;
                break;
            default:
            //do nothing
        }
        return formattedTime;
    },

    doDatesHaveSameDay(date1, date2) {
        if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
            return false; // Ensure both inputs are Date objects
        }

        return (
            date1.getUTCFullYear() === date2.getUTCFullYear() &&
            date1.getUTCMonth() === date2.getUTCMonth() &&
            date1.getUTCDate() === date2.getUTCDate()
        );
    }
};

export default datetime;
