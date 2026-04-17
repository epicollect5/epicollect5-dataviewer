import PARAMETERS from '@/config/parameters';

const formatters = {
  getFormattedDate(inputDate, theFormat) {
    if (inputDate === '') {
      return '';
    }

    const date = inputDate.split('T');
    const dateParts = date[0].split('-');
    const day = dateParts[2];
    const month = dateParts[1];
    const year = dateParts[0];
    let formattedDate = '';

    switch (theFormat) {
      case PARAMETERS.DATE_FORMAT_1:
        formattedDate = `${day}/${month}/${year}`;
        break;
      case PARAMETERS.DATE_FORMAT_2:
        formattedDate = `${month}/${day}/${year}`;
        break;
      case PARAMETERS.DATE_FORMAT_3:
        formattedDate = `${year}/${month}/${day}`;
        break;
      case PARAMETERS.DATE_FORMAT_4:
        formattedDate = `${month}/${year}`;
        break;
      case PARAMETERS.DATE_FORMAT_5:
        formattedDate = `${day}/${month}`;
        break;
      default:
    }

    return formattedDate;
  },

  getFormattedTime(inputDate, theFormat) {
    if (inputDate === '' || theFormat === '') {
      return '';
    }

    const date = inputDate.split('T');
    const timeParts = date[1].split(':');
    const secondsPart = timeParts[timeParts.length - 1].split('.');
    const hours24 = timeParts[0];
    const minutes = timeParts[1];
    const seconds = secondsPart[0];
    let formattedTime = '';
    let hours12;

    if (parseInt(hours24, 10) > 12) {
      hours12 = ((parseInt(hours24, 10) + 11) % 12) + 1;
      hours12 = hours12 < 10 ? `0${hours12.toString()}` : hours12;
    } else {
      hours12 = hours24;
    }

    switch (theFormat) {
      case PARAMETERS.TIME_FORMAT_1:
        formattedTime = `${hours24}:${minutes}:${seconds}`;
        break;
      case PARAMETERS.TIME_FORMAT_2:
        formattedTime = `${hours12}:${minutes}:${seconds}`;
        break;
      case PARAMETERS.TIME_FORMAT_3:
        formattedTime = `${hours24}:${minutes}`;
        break;
      case PARAMETERS.TIME_FORMAT_4:
        formattedTime = `${hours12}:${minutes}`;
        break;
      case PARAMETERS.TIME_FORMAT_5:
        formattedTime = `${minutes}:${seconds}`;
        break;
      default:
    }

    return formattedTime;
  },

  doDatesHaveSameDay(date1, date2) {
    if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
      return false;
    }

    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  }
};

export default formatters;
