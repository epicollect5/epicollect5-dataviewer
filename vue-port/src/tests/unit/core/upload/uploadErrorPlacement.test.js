import { getErrorMessageForColumn } from '@/core/upload/uploadErrorPlacement';

describe('core/upload/uploadErrorPlacement', () => {
  const reverseMapping = {
    reverse: {
      ec5_uuid: {
        input_ref: null
      },
      name: {
        input_ref: 'input_name'
      },
      age: {
        input_ref: 'input_age'
      }
    }
  };

  it('places field-specific errors under the matching column', () => {
    expect(
      getErrorMessageForColumn({
        errors: [{ source: 'input_age', title: 'Age is invalid' }],
        columnKey: 'age',
        columnIndex: 2,
        reverseMapping
      })
    ).toBe('Age is invalid');
  });

  it('falls back general errors to the first data column', () => {
    expect(
      getErrorMessageForColumn({
        errors: [{ source: 'upload-controller', code: 'ec5_201', title: 'Project version is outdated' }],
        columnKey: 'ec5_uuid',
        columnIndex: 0,
        reverseMapping
      })
    ).toBe('Project version is outdated');

    expect(
      getErrorMessageForColumn({
        errors: [{ source: 'upload-controller', code: 'ec5_201', title: 'Project version is outdated' }],
        columnKey: 'name',
        columnIndex: 1,
        reverseMapping
      })
    ).toBe('');
  });
});
