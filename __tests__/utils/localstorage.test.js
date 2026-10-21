import localstorage from 'utils/localstorage';

const STORAGE_KEY = 'epicollect5-restore';

const buildStorage = (overrides) => {
    const store = {};
    return {
        getItem: jest.fn((key) => (key in store ? store[key] : null)),
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        ...(overrides || {})
    };
};

describe('localstorage utils test', () => {

    let originalLocalStorage;

    beforeEach(() => {
        originalLocalStorage = window.localStorage;
    });

    afterEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            configurable: true,
            writable: true
        });
    });

    const useStorage = (storage) => {
        Object.defineProperty(window, 'localStorage', {
            value: storage,
            configurable: true,
            writable: true
        });
        return storage;
    };

    it('should save and read the restore params back', () => {
        const storage = useStorage(buildStorage());

        localstorage.save({ formRef: 'form-1', isViewingChildren: true });

        expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify({ formRef: 'form-1', isViewingChildren: true }));
        expect(localstorage.getRestoreParams()).toEqual({ formRef: 'form-1', isViewingChildren: true });
    });

    it('should clear the restore params', () => {
        const storage = useStorage(buildStorage());

        localstorage.save({ formRef: 'form-1' });
        localstorage.clear();

        expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        expect(localstorage.getRestoreParams()).toBe(null);
    });

    it('should return false when the stored value is not valid json', () => {
        const storage = useStorage(buildStorage());

        storage.setItem(STORAGE_KEY, 'not a json');

        expect(localstorage.getRestoreParams()).toBe(false);
    });

    it('should not throw when the storage is full', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const error = new Error('quota exceeded');

        useStorage(buildStorage({
            setItem: jest.fn(() => {
                throw error;
            })
        }));

        expect(() => localstorage.save({ formRef: 'form-1' })).not.toThrow();
        expect(logSpy).toHaveBeenCalled();

        logSpy.mockRestore();
    });

    it('should not throw when the storage cannot be cleared', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const error = new Error('storage is not available');

        useStorage(buildStorage({
            removeItem: jest.fn(() => {
                throw error;
            })
        }));

        expect(() => localstorage.clear()).not.toThrow();
        expect(logSpy).toHaveBeenCalled();

        logSpy.mockRestore();
    });
});
