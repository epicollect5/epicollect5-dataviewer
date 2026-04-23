import PARAMETERS from '@/core/config/parameters';
import { create, eye, trash } from 'ionicons/icons';
import { useModalStore } from '@/stores/modalStore';

const ACTION_ICONS = {
  view: eye,
  delete: trash,
  edit: create
};

const buildViewPayload = (headers, cells) => ({
  entryTitle: cells[4]?.answer || 'Untitled entry',
  viewHeaders: headers,
  viewAnswers: cells.slice(PARAMETERS.TABLE_FIXED_HEADERS_TOTAL)
});

const buildDeletePayload = (cells) => {
  const sourceCell = cells.find((cell) => cell?.attributes && cell?.relationships) || cells[0] || {};

  return {
    entryUuid: sourceCell.entryUuid || cells[0]?.entryUuid || null,
    entryTitle: cells[4]?.answer || 'Untitled entry',
    entryExtra: {
      attributes: sourceCell.attributes,
      relationships: sourceCell.relationships
    }
  };
};

const createActionColumn = (headerName, field, headers = [], width = 92) => ({
  headerName,
  field,
  pinned: 'left',
  lockPinned: true,
  sortable: false,
  filter: false,
  resizable: false,
  suppressMovable: true,
  width,
  minWidth: width,
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
        modalStore.open('view-entry', buildViewPayload(headers, params.data.__cells || []));
      });
    }

    if (field === 'delete') {
      const modalStore = useModalStore();
      button.addEventListener('click', () => {
        modalStore.open('delete-entry', buildDeletePayload(params.data.__cells || []));
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
  button.className = 'entries-grid__media-button';

  if (value.entry_original?.includes('format=audio')) {
    button.textContent = 'Play audio';
    button.addEventListener('click', () => {
      modalStore.open('media-viewer', {
        mediaType: 'audio',
        title: 'Audio',
        src: value.entry_original
      });
    });

    return button;
  }

  button.textContent = 'Play video';
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

export const createEntriesColumnDefs = (headers = []) => {
  const fixedColumns = [
    createActionColumn('View', 'view', headers),
    createActionColumn('Delete', 'delete', headers),
    createActionColumn('Edit', 'edit', headers),
    {
      headerName: 'Children',
      field: 'children',
      pinned: 'left',
      lockPinned: true,
      width: 110,
      minWidth: 110
    },
    {
      headerName: 'Title',
      field: 'title',
      pinned: 'left',
      lockPinned: true,
      width: 220,
      minWidth: 180
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      pinned: 'left',
      lockPinned: true,
      width: 160,
      minWidth: 140
    }
  ];

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
