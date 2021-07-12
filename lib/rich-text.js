const getEmbedDetails = img => {
  const regex = new RegExp(`(https):\\/\\/([\\w_-]+(?:(?:\\.[\\w_-]+)+))([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?`, 'ig');
  const match = regex.exec(img);
  if (match[0].includes('youtube')) {
    const matchIdRegex = new RegExp(`img.youtube.com\\/vi\\/(.+?)\\/`, 'ig');
    const videoId = matchIdRegex.exec(match[0])[1];
    return { videoService: 'youtube', videoId };
  }
};

const constructVideoEmbedURL = (service, id) => {
  if (service === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } else {
    return null;
  }
};

const replaceImgPreviews = longDescription => {
  const regexImg = new RegExp(`<img([\\w\\W]+?)[\\/]?>`, 'g');
  const regexUrl = new RegExp(
    `(https):\\/\\/([\\w_-]+(?:(?:\\.[\\w_-]+)+))([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?`,
    'ig',
  );
  return longDescription.replaceAll(regexImg, match => {
    let iframeReplacement;
    if (match.includes('img.youtube.com')) {
      if (match.includes('\\&quot')) {
        iframeReplacement = match.replace('<img', '<iframe width=\\&quot100%\\&quot height=\\&quot394\\&quot');
      } else {
        iframeReplacement = match.replace('<img', '<iframe width="100%" height="394"');
      }
      const { videoService, videoId } = getEmbedDetails(iframeReplacement);
      const videoIframeURL = constructVideoEmbedURL(videoService, videoId);
      return iframeReplacement.replace(regexUrl, videoIframeURL);
    }
  });
};

export default replaceImgPreviews;
