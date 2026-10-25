import PARAMETERS from '@/core/config/parameters';
import { add, eye, pencil, play, trash } from 'ionicons/icons';
import {
  canEditEntryForProjectUser,
  openAddBranchEntry,
  openAddChildEntry,
  openEditEntry
} from '@/services/entries/dataEditorFlow';
import { useModalStore } from '@/stores/modalStore';
import { useTableStore } from '@/stores/tableStore';

const ACTION_ICONS = {
  view: eye,
  delete: trash,
  edit: pencil
};

const handleChildCountClick = (params) => {
  const entryUuid = params.data?.id || null;

  if (!entryUuid) {
    return;
  }

  void useTableStore().loadChildEntries({
    entryUuid,
    entryTitle: params.data?.title || ''
  });
};

const handleAddChildEntryClick = (params) => {
  openAddChildEntry({
    entryUuid: params.data?.id || null
  });
};

const handleBranchCountClick = (params, cell) => {
  if (!cell?.entryUuid || !cell?.inputRef) {
    return;
  }

  void useTableStore().loadBranchEntries({
    entryUuid: cell.entryUuid,
    entryTitle: params.data?.title || '',
    branchRef: cell.inputRef
  });
};

const handleAddBranchEntryClick = (params, cell) => {
  openAddBranchEntry({
    entryUuid: cell?.entryUuid || null,
    branchRef: cell?.inputRef || null,
    entryTitle: params.data?.title || ''
  });
};

//branch tables have one fixed cell less than hierarchy tables, so the offsets
//cannot be hardcoded
const getFixedCellsTotal = (data = {}) => {
  return data.__fixedCellsTotal || PARAMETERS.TABLE_FIXED_HEADERS_TOTAL;
};

const buildViewPayload = (headers, data = {}) => {
  const cells = data.__cells || [];
  const fixedCellsTotal = getFixedCellsTotal(data);

  return {
    entryTitle: cells[fixedCellsTotal - 2]?.answer || 'Untitled entry',
    viewHeaders: headers,
    viewAnswers: cells.slice(fixedCellsTotal)
  };
};

const buildDeletePayload = (data = {}) => {
  const cells = data.__cells || [];
  const sourceCell = cells.find((cell) => cell?.attributes && cell?.relationships) || cells[0] || {};

  return {
    entryUuid: sourceCell.entryUuid || cells[0]?.entryUuid || null,
    entryTitle: cells[getFixedCellsTotal(data) - 2]?.answer || 'Untitled entry',
    entryExtra: {
      attributes: sourceCell.attributes,
      relationships: sourceCell.relationships
    }
  };
};

const buildEditTarget = (data = {}) => {
  const cells = data.__cells || [];
  const actionCell = cells.find((cell) => cell?.cellType === PARAMETERS.CEll_TYPES.EDIT) || {};
  const ownershipCell = cells.find((cell) => cell?.relationships) || {};

  return {
    entryUuid: actionCell.entryUuid || data.id || null,
    relationships: ownershipCell.relationships
  };
};

const FIXED_COLUMN_BASE = {
  pinned: 'left',
  lockPinned: true,
  lockPosition: 'left',
  sortable: false,
  filter: false,
  resizable: false,
  suppressMovable: true
};

const createActionColumn = (headerName, field, headers = [], width = 70) => ({
  headerName,
  field,
  ...FIXED_COLUMN_BASE,
  width,
  minWidth: width,
  maxWidth: width,
  headerClass: 'entries-grid__fixed-header entries-grid__fixed-header--action',
  cellClass: 'entries-grid__action-cell',
  cellRenderer: (params) => {
    const button = document.createElement('button');
    button.className = `entries-grid__action-button entries-grid__action-button--${field}`;
    button.type = 'button';
    button.setAttribute('aria-label', headerName);

    const icon = document.createElement('ion-icon');
    icon.className = 'entries-grid__action-icon';
    icon.icon = ACTION_ICONS[field] || eye;
    button.appendChild(icon);

    if (field === 'view') {
      const modalStore = useModalStore();
      button.addEventListener('click', () => {
        modalStore.open('view-entry', buildViewPayload(headers, params.data || {}));
      });
    }

    if (field === 'delete') {
      const modalStore = useModalStore();
      button.addEventListener('click', () => {
        modalStore.open('delete-entry', buildDeletePayload(params.data || {}));
      });
    }

    if (field === 'edit') {
      const target = buildEditTarget(params.data || {});

      button.disabled = !canEditEntryForProjectUser({ relationships: target.relationships });
      button.addEventListener('click', () => {
        openEditEntry({ entryUuid: target.entryUuid });
      });
    }

    return button;
  }
});

const createMediaCell = (value, entryTitle = 'Untitled entry') => {
  if (!value || typeof value !== 'object' || !value.entry_default) {
    return value ?? '';
  }

  const modalStore = useModalStore();

  if (value.entry_thumb || value.entry_original?.includes('format=entry_original')) {
    const wrapper = document.createElement('button');
    wrapper.type = 'button';
    wrapper.className = 'entries-grid__photo-button';

    const frame = document.createElement('span');
    frame.className = 'entries-grid__photo-frame';

    const mat = document.createElement('span');
    mat.className = 'entries-grid__photo-mat';

    const viewport = document.createElement('span');
    viewport.className = 'entries-grid__photo-viewport';

    const loader = document.createElement('span');
    loader.className = 'entries-grid__photo-loader';

    const loaderSpinner = document.createElement('span');
    loaderSpinner.className = 'loader-spinner';
    loader.appendChild(loaderSpinner);

    const img = document.createElement('img');
    img.className = 'entries-grid__photo-thumb';
    img.alt = 'thumbnail';
    img.src = value.entry_default;
    img.addEventListener('load', () => {
      loader.remove();
      img.classList.add('entries-grid__photo-thumb--ready');
    });

    viewport.appendChild(loader);
    viewport.appendChild(img);
    mat.appendChild(viewport);
    frame.appendChild(mat);
    wrapper.appendChild(frame);
    wrapper.addEventListener('click', () => {
      modalStore.openPhotoViewer({
        title: entryTitle,
        src: value.entry_original,
        previewSrc: value.entry_thumb || value.entry_default
      });
    });

    return wrapper;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'play-button play-button--block';

  const icon = document.createElement('ion-icon');
  icon.className = 'play-button__icon';
  icon.setAttribute('icon', play);

  const label = document.createElement('span');
  label.className = 'play-button__label';
  label.textContent = value.entry_original?.includes('format=audio') ? 'Play audio' : 'Play video';

  button.appendChild(icon);
  button.appendChild(label);

  if (value.entry_original?.includes('format=audio')) {
    button.addEventListener('click', () => {
      modalStore.open('media-viewer', {
        mediaType: 'audio',
        title: 'Audio',
        src: value.entry_original
      });
    });

    return button;
  }

  button.addEventListener('click', () => {
    modalStore.open('media-viewer', {
      mediaType: 'video',
      title: 'Video',
      src: value.entry_original
    });
  });

  return button;
};

const createTextCell = (value, isLastDynamicColumn = false) => {
  const content = document.createElement('div');
  content.className = isLastDynamicColumn
    ? 'entries-grid__text-value entries-grid__text-value--last'
    : 'entries-grid__text-value';
  content.textContent = value ?? '';

  return content;
};

const createFixedTextCell = (value) => {
  const content = document.createElement('div');
  content.className = 'entries-grid__fixed-text-value';
  content.textContent = value ?? '';
  content.title = value ?? '';

  return content;
};

const createCountAddCell = ({ count, countLabel, addLabel, canAddEntry, onCountClick, onAddClick }) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'entries-grid__children-cell-content';

  const countButton = document.createElement('button');
  countButton.className = 'entries-grid__children-count-button';
  countButton.type = 'button';
  countButton.textContent = count;
  countButton.setAttribute('aria-label', `${countLabel} (${count})`);
  countButton.addEventListener('click', onCountClick);

  wrapper.appendChild(countButton);

  if (!canAddEntry) {
    return wrapper;
  }

  const addButton = document.createElement('button');
  addButton.className = 'entries-grid__action-button entries-grid__action-button--add';
  addButton.type = 'button';
  addButton.setAttribute('aria-label', addLabel);
  addButton.addEventListener('click', onAddClick);

  const icon = document.createElement('ion-icon');
  icon.className = 'entries-grid__action-icon';
  icon.icon = add;
  addButton.appendChild(icon);

  wrapper.appendChild(addButton);

  return wrapper;
};

const createChildrenCell = (params, canAddEntry = false) => {
  return createCountAddCell({
    count: params.value ?? 0,
    countLabel: 'Open child entries',
    addLabel: 'Add child entry',
    canAddEntry,
    onCountClick: () => {
      handleChildCountClick(params);
    },
    onAddClick: () => {
      handleAddChildEntryClick(params);
    }
  });
};

const createBranchCell = (params, cell, canAddEntry = false) => {
  return createCountAddCell({
    count: cell.answer ?? 0,
    countLabel: 'Open branch entries',
    addLabel: 'Add branch entry',
    canAddEntry,
    onCountClick: () => {
      handleBranchCountClick(params, cell);
    },
    onAddClick: () => {
      handleAddBranchEntryClick(params, cell);
    }
  });
};

const getDynamicCellClass = (value, isLastDynamicColumn = false) => {
  const classes = [];

  if (value && typeof value === 'object' && value.entry_default) {
    classes.push('entries-grid__media-cell');
  } else {
    classes.push('entries-grid__text-cell');
  }

  if (isLastDynamicColumn) {
    classes.push(classes[0] === 'entries-grid__media-cell' ? 'entries-grid__media-cell--last' : 'entries-grid__text-cell--last');
  }

  return classes.join(' ');
};

export const createEntriesColumnDefs = (headers = [], options = {}) => {
  const childFormName = options.childFormName || 'Children';
  const fixedColumns = [
    createActionColumn('View', 'view', headers),
    createActionColumn('Delete', 'delete', headers),
    createActionColumn('Edit', 'edit', headers)
  ];

  if (options.hasChildForm) {
    fixedColumns.push({
      headerName: childFormName,
      field: 'children',
      ...FIXED_COLUMN_BASE,
      width: 110,
      minWidth: 110,
      headerClass: 'entries-grid__fixed-header',
      cellClass: 'entries-grid__children-cell',
      cellRenderer: (params) => createChildrenCell(params, options.canAddEntry)
    });
  }

  fixedColumns.push(
    {
      headerName: 'Title',
      field: 'title',
      ...FIXED_COLUMN_BASE,
      width: 220,
      minWidth: 180,
      headerClass: 'entries-grid__fixed-header',
      cellClass: 'entries-grid__fixed-text-cell',
      cellRenderer: (params) => createFixedTextCell(params.value)
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      ...FIXED_COLUMN_BASE,
      width: 160,
      minWidth: 140,
      headerClass: 'entries-grid__fixed-header',
      cellClass: 'entries-grid__fixed-text-cell',
      cellRenderer: (params) => createFixedTextCell(params.value)
    }
  );

  const dynamicColumns = headers.map((header, index) => {
    const isLastDynamicColumn = index === headers.length - 1;

    return {
      headerName: header.question,
      field: `answer_${index}`,
      cellDataType: false,
      minWidth: 200,
      maxWidth: 200,
      width: 200,
      wrapText: false,
      autoHeight: false,
      resizable: false,
      suppressMovable: true,
      headerClass: isLastDynamicColumn
        ? 'entries-grid__dynamic-header entries-grid__dynamic-header--last'
        : 'entries-grid__dynamic-header',
      cellClass: (params) => getDynamicCellClass(params.value, isLastDynamicColumn),
      cellRenderer: (params) => {
        const value = params.value;
        const dynamicOffset = params.data?.__fixedCellsTotal || PARAMETERS.TABLE_FIXED_HEADERS_TOTAL;
        const cell = params.data?.__cells?.[dynamicOffset + index];

        if (cell?.cellType === PARAMETERS.CEll_TYPES.BRANCH) {
          return createBranchCell(params, cell, options.canAddEntry);
        }

        if (value && typeof value === 'object') {
          if (value.entry_default) {
            return createMediaCell(value, params.data?.title || 'Untitled entry');
          }

          return createTextCell(JSON.stringify(value), isLastDynamicColumn);
        }

        return createTextCell(value, isLastDynamicColumn);
      }
    };
  });

  return [...fixedColumns, ...dynamicColumns];
};
