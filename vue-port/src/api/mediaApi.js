import PARAMETERS from '@/config/parameters';

export const getMediaUrl = (projectSlug, fileType, fileName) => {
  const url = new URL(`${PARAMETERS.API_MEDIA_ENDPOINT}${projectSlug}`, PARAMETERS.SERVER_URL);
  url.searchParams.set('type', fileType);
  url.searchParams.set('name', fileName);
  return url.toString();
};
