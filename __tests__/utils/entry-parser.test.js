import moment from 'moment';
import entryParser from 'utils/entry-parser';
import PARAMETERS from 'config/parameters';
import { getProjectExtra, FORM_REF, BRANCH_REF } from '../fixtures/projectExtra';
import { getEntry, getBranchEntry } from '../fixtures/entries';

const projectExtra = getProjectExtra();
const projectSlug = 'a-project';
const entryUuid = 'entry-uuid-1';

const entry = getEntry();

const branchRow = {
    ...getEntry(),
    branch_entry: getBranchEntry()
};

const parse = (inputRef, currentEntry, branchInputRef) => {
    return entryParser.getParsedEntryForDisplay(
        projectSlug,
        FORM_REF,
        currentEntry || entry,
        inputRef,
        projectExtra,
        entryUuid,
        branchInputRef
    );
};

const MEDIA_BASE_URL = PARAMETERS.SERVER_URL + PARAMETERS.API_MEDIA_ENDPOINT + projectSlug;

describe('entry parser utils test', () => {

    describe('getParsedEntryForDisplay', () => {

        it('should parse a text answer (default branch)', () => {
            const parsed = parse('text-ref');

            expect(parsed).toHaveLength(1);
            expect(parsed[0].answer).toBe('a text answer');
            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
            expect(parsed[0].inputType).toBe(PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE);
            expect(parsed[0].inputRef).toBe('text-ref');
            expect(parsed[0].entryUuid).toBe(entryUuid);
        });

        it('should parse a textarea answer (default branch)', () => {
            const parsed = parse('textarea-ref');
            expect(parsed[0].answer).toBe('a textarea answer');
        });

        it('should parse a location answer as "latitude, longitude"', () => {
            const parsed = parse('location-ref');
            expect(parsed[0].answer).toBe('45.463822, 9.190268');
            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
        });

        it('should parse an empty location answer as an empty string', () => {
            const emptyLocationEntry = getEntry({
                entry: {
                    answers: {
                        'location-ref': {
                            answer: { latitude: '', longitude: '' },
                            was_jumped: false
                        }
                    }
                }
            });

            const parsed = parse('location-ref', emptyLocationEntry);
            expect(parsed[0].answer).toBe('');
        });

        it('should parse a branch answer from the branch counts', () => {
            const parsed = parse('branch-ref');
            expect(parsed[0].answer).toBe(3);
            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.BRANCH);
        });

        it('should default the branch answer to 0 when there are no branch counts', () => {
            const noBranchCountsEntry = getEntry({
                attributes: {
                    child_counts: 2,
                    branch_counts: null
                }
            });

            const parsed = parse('branch-ref', noBranchCountsEntry);
            expect(parsed[0].answer).toBe(0);
        });

        it('should parse a date answer with the input datetime format', () => {
            const parsed = parse('date-ref');
            expect(parsed[0].answer).toBe('24/02/2018');
        });

        it('should parse a time answer with the input datetime format', () => {
            const parsed = parse('time-ref');
            expect(parsed[0].answer).toBe('17:59:29');
        });

        it('should parse an audio answer as a media object', () => {
            const parsed = parse('audio-ref');

            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.MEDIA);
            expect(parsed[0].answer.entry_original).toBe(MEDIA_BASE_URL + '?type=audio&format=audio&name=audio-file.mp3');
            expect(parsed[0].answer.entry_thumb).toBe(null);
            expect(parsed[0].answer.entry_sidebar).toBe(null);
            expect(parsed[0].answer.entry_default).toBe(MEDIA_BASE_URL + '?type=audio&format=audio&name=audio-file.mp3');
        });

        it('should parse a video answer as a media object', () => {
            const parsed = parse('video-ref');

            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.MEDIA);
            expect(parsed[0].answer.entry_original).toBe(MEDIA_BASE_URL + '?type=video&format=video&name=video-file.mp4');
            expect(parsed[0].answer.entry_thumb).toBe(null);
            expect(parsed[0].answer.entry_sidebar).toBe(null);
        });

        it('should parse a photo answer as a media object with a cache buster', () => {
            const parsed = parse('photo-ref');

            const version = moment(entry.entry.uploaded_at).unix();

            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.MEDIA);
            expect(parsed[0].answer.entry_original).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_original&name=photo-file.jpg&v=' + version);
            expect(parsed[0].answer.entry_thumb).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_thumb&name=photo-file.jpg&v=' + version);
            expect(parsed[0].answer.entry_sidebar).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_original&name=photo-file.jpg&v=' + version);
            expect(parsed[0].answer.entry_default).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_thumb&name=photo-file.jpg&v=' + version);
        });

        it('should parse an empty media answer as an empty string', () => {
            const emptyMediaEntry = getEntry({
                entry: {
                    answers: {
                        'photo-ref': {
                            answer: '',
                            was_jumped: false
                        }
                    }
                }
            });

            const parsed = parse('photo-ref', emptyMediaEntry);
            expect(parsed[0].answer).toBe('');
        });

        it('should map a radio answer ref to its label', () => {
            const parsed = parse('radio-ref');
            expect(parsed[0].answer).toBe('Radio A');
        });

        it('should map a dropdown answer ref to its label', () => {
            const parsed = parse('dropdown-ref');
            expect(parsed[0].answer).toBe('Dropdown A');
        });

        it('should map the checkbox answer refs to their labels', () => {
            const parsed = parse('checkbox-ref');
            expect(parsed[0].answer).toBe('Checkbox A, Checkbox B');
        });

        it('should map the search single answer ref to its label', () => {
            const parsed = parse('searchsingle-ref');
            expect(parsed[0].answer).toBe('Search Single A');
        });

        it('should map the search multiple answer refs to their labels', () => {
            const parsed = parse('searchmultiple-ref');
            expect(parsed[0].answer).toBe('Search Multiple A, Search Multiple B');
        });

        it('should join the dataset single answer', () => {
            const parsed = parse('dataset-single-ref');
            expect(parsed[0].answer).toBe('dataset-ref-a');
        });

        it('should join the dataset multiple answer', () => {
            const parsed = parse('dataset-multiple-ref');
            expect(parsed[0].answer).toBe('dataset-ref-b, dataset-ref-c');
        });

        it('should flatten a group into its answered members', () => {
            //a group input carries no answer of its own (its members do), so the
            //group branch is only reachable when the input does have one
            const entryWithGroupAnswer = getEntry({
                entry: {
                    answers: {
                        'group-ref': {
                            answer: '',
                            was_jumped: false
                        }
                    }
                }
            });

            const parsed = parse('group-ref', entryWithGroupAnswer);

            expect(parsed).toHaveLength(1);
            expect(parsed[0].inputRef).toBe('group-text-ref');
            expect(parsed[0].answer).toBe('a group text answer');
        });

        it('should return an empty answer when the question was jumped', () => {
            const jumpedEntry = getEntry({
                entry: {
                    answers: {
                        'text-ref': {
                            answer: 'a text answer',
                            was_jumped: true
                        }
                    }
                }
            });

            const parsed = parse('text-ref', jumpedEntry);

            expect(parsed[0].answer).toBe('');
            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
        });

        it('should parse a branch answer from the branch entry', () => {
            const parsed = parse('branch-radio-ref', branchRow, BRANCH_REF);
            expect(parsed[0].answer).toBe('Branch Radio A');
        });

        it('should return an empty answer when the input has no answer', () => {
            const entryWithoutAnswers = {
                ...getEntry(),
                entry: {
                    ...getEntry().entry,
                    answers: {}
                }
            };

            const parsed = parse('text-ref', entryWithoutAnswers);

            expect(parsed).toHaveLength(1);
            expect(parsed[0].answer).toBe('');
            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
            expect(parsed[0].inputRef).toBe('text-ref');
        });

        it('should return an empty answer when the branch entry has no answers', () => {
            const branchRowWithoutAnswers = {
                ...getEntry(),
                branch_entry: {
                    ...getBranchEntry(),
                    answers: {}
                }
            };

            const parsed = parse('branch-text-ref', branchRowWithoutAnswers, BRANCH_REF);

            expect(parsed).toHaveLength(1);
            expect(parsed[0].answer).toBe('');
            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
        });

        it('should return an empty answer when the branch entry is missing', () => {
            const rowWithoutBranchEntry = {
                ...getEntry(),
                branch_entry: null
            };

            const parsed = parse('branch-text-ref', rowWithoutBranchEntry, BRANCH_REF);

            expect(parsed).toHaveLength(1);
            expect(parsed[0].answer).toBe('');
            expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
        });
    });

    describe('getEmptyEntryForDisplay', () => {

        it('should return an empty text answer keeping the entry attributes', () => {
            const empty = entryParser.getEmptyEntryForDisplay(entry);

            expect(empty.inputType).toBe(PARAMETERS.INPUT_TYPES.TEXT);
            expect(empty.cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
            expect(empty.answer).toBe('');
            expect(empty.attributes).toBe(entry.attributes);
            expect(empty.relationships).toBe(entry.relationships);
        });
    });

    describe('getMediaURL', () => {

        it('should build the audio media urls', () => {
            const media = entryParser.getMediaURL(projectSlug, 'a-file.mp3', PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE, '2018-02-24T17:59:29.179Z');

            expect(media.entry_original).toBe(MEDIA_BASE_URL + '?type=audio&format=audio&name=a-file.mp3');
            expect(media.entry_thumb).toBe(null);
            expect(media.entry_sidebar).toBe(null);
            expect(media.entry_default).toBe(MEDIA_BASE_URL + '?type=audio&format=audio&name=a-file.mp3');
        });

        it('should build the video media urls', () => {
            const media = entryParser.getMediaURL(projectSlug, 'a-file.mp4', PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE, '2018-02-24T17:59:29.179Z');

            expect(media.entry_original).toBe(MEDIA_BASE_URL + '?type=video&format=video&name=a-file.mp4');
            expect(media.entry_thumb).toBe(null);
            expect(media.entry_sidebar).toBe(null);
        });

        it('should build the photo media urls with the version cache buster', () => {
            const uploadedAt = '2018-02-24T17:59:29.179Z';
            const version = moment(uploadedAt).unix();
            const media = entryParser.getMediaURL(projectSlug, 'a-file.jpg', PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE, uploadedAt);

            expect(media.entry_original).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_original&name=a-file.jpg&v=' + version);
            expect(media.entry_thumb).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_thumb&name=a-file.jpg&v=' + version);
            expect(media.entry_sidebar).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_original&name=a-file.jpg&v=' + version);
            expect(media.entry_default).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_thumb&name=a-file.jpg&v=' + version);
        });

        it('should build the photo media urls without a version when there is no upload date', () => {
            const media = entryParser.getMediaURL(projectSlug, 'a-file.jpg', PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE, null);

            expect(media.entry_original).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_original&name=a-file.jpg');
            expect(media.entry_default).toBe(MEDIA_BASE_URL + '?type=photo&format=entry_thumb&name=a-file.jpg');
        });
    });

    describe('getMultipleChoiceAnswer', () => {

        const getAnswer = (inputRef, inputRawAnswer, branchInputRef, input) => {
            return entryParser.getMultipleChoiceAnswer(
                projectExtra,
                FORM_REF,
                inputRawAnswer,
                inputRef,
                branchInputRef,
                input
            );
        };

        it('should look the possible answers up in the form lists', () => {
            const answer = getAnswer(
                'radio-ref',
                { answer: 'radio-ref-b', was_jumped: false },
                null,
                { type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE }
            );

            expect(answer).toBe('Radio B');
        });

        it('should look the possible answers up in the branch lists', () => {
            const answer = getAnswer(
                'branch-radio-ref',
                { answer: 'branch-radio-ref-a', was_jumped: false },
                BRANCH_REF,
                { type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE }
            );

            expect(answer).toBe('Branch Radio A');
        });

        it('should join the labels of an array answer', () => {
            const answer = getAnswer(
                'checkbox-ref',
                { answer: ['checkbox-ref-a', 'checkbox-ref-b'], was_jumped: false },
                null,
                { type: PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE }
            );

            expect(answer).toBe('Checkbox A, Checkbox B');
        });

        it('should return an empty answer when the input has no possible answers', () => {
            const answer = getAnswer(
                'text-ref',
                { answer: 'a text answer', was_jumped: false },
                null,
                { type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE }
            );

            expect(answer).toBe('');
        });
    });
});
