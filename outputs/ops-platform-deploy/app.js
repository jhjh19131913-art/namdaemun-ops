const STORAGE_KEY = "ndm_ops_platform_v1";
const TAG_SCHEMA_VERSION = 2;
const TAG_MIGRATION_BACKUP_KEY = "ndm_ops_tag_migration_backup_v2";
const TAG_CLOUD_MIGRATION_BACKUP_KEY = "ndm_ops_tag_cloud_migration_backup_v2";
const TAG_SETTINGS_BACKUP_KEY = "ndm_ops_tag_settings_backup_v2";
const TAG_MIGRATION_ERRORS_KEY = "ndm_ops_tag_migration_errors_v2";
const CLOUD_CONFIG_KEY = "ndm_ops_cloud_v1";
const LAST_EMAIL_KEY = "ndm_ops_last_email_v1";
const EMAIL_STORAGE_KEYS = [LAST_EMAIL_KEY, "ndm_ops_login_email_v1"];
const ORDER_BOARD_KEY = "ndm_order_image_board_v1";
const DEFAULT_CLOUD_URL = "https://qslckhefgueflmsxawxz.supabase.co";
const DEFAULT_CLOUD_ANON_KEY = "sb_publishable_CATcL7oVdh4cmJhOxMISFA_Bm65K5ki";
const AUTO_SYNC_INTERVAL_MS = 45000;
const CLOUD_PUSH_DELAY_MS = 350;
const CLOUD_RETRY_DELAY_MS = 8000;
const CLOUD_RETRY_MAX_DELAY_MS = 60000;
const ORDER_IMAGE_BUCKET = "order-images";
const ORDER_IMAGE_MAX_SIZE = 1280;
const ORDER_IMAGE_QUALITY = 0.82;
const CHINA_PRE_ORDER_TAGS = ["문의", "가격확인", "재고확인", "거래처확인", "샘플확인", "진행", "발주확정대기", "보류"];
const CHINA_LEGACY_ORDER_TAGS = ["발주대기", "재고진행", "거래처진행", "확인", "피드백대기"];
const ORDER_STATUS_OPTIONS = ["발주완료", "진행", "이번 주 선적", "선적완료", "입고대기", "매장 출고 연결", "완료", "보류"];
const ORDER_CATEGORY_OPTIONS = ["거래처진행", "재고진행"];
const DEFAULT_ORDER_CATEGORY = "거래처진행";
const ORDER_DELIVERY_OPTIONS = ["전달대기", "전달완료"];
const DEFAULT_ORDER_DELIVERY_STATUS = "전달대기";
const STORE_SHIP_ACTION_LABELS = {
  complete: "출고 완료",
  statement: "사무실 / 명세서",
  "statement-tax": "사무실 / 명세서 + 세금계산서",
  tax: "사무실 / 세금계산서",
};

const DEFAULT_ORDER_FIELDS = [
  { id: "name", label: "상품명" },
  { id: "factory", label: "공장명" },
  { id: "price", label: "단가" },
  { id: "moq", label: "MOQ" },
  { id: "leadTime", label: "납기" },
  { id: "memo", label: "메모" },
  { id: "alias", label: "별칭 검색어" },
  { id: "customer", label: "거래처 검색어" },
  { id: "feature", label: "특징 메모" },
];

function tagDefinition(id, name, groupId, order) {
  return { id, name, groupId, order, isActive: true };
}

const DEFAULT_GROUPS = [
  {
    id: "group_store",
    name: "매장",
    tags: [
      tagDefinition("tag_store_shipping", "출고", "group_store", 1),
      tagDefinition("tag_store_waiting", "출고대기", "group_store", 2),
      tagDefinition("tag_store_check", "매장체크", "group_store", 3),
      tagDefinition("tag_store_contact", "연락", "group_store", 4),
      tagDefinition("tag_store_hold", "보류", "group_store", 5),
    ],
  },
  {
    id: "group_china",
    name: "중국",
    tags: CHINA_PRE_ORDER_TAGS.map((name, index) =>
      tagDefinition(
        {
          문의: "tag_china_inquiry",
          가격확인: "tag_china_price_check",
          재고확인: "tag_china_stock_check",
          거래처확인: "tag_china_customer_check",
          샘플확인: "tag_china_sample_check",
          진행: "tag_china_progress",
          발주확정대기: "tag_china_order_waiting",
          보류: "tag_china_hold",
        }[name],
        name,
        "group_china",
        index + 1,
      ),
    ),
  },
  {
    id: "group_office",
    name: "사무실",
    tags: [
      tagDefinition("tag_office_statement", "명세서", "group_office", 1),
      tagDefinition("tag_office_organize", "자료정리", "group_office", 2),
      tagDefinition("tag_office_tax", "세금계산서", "group_office", 3),
    ],
  },
  {
    id: "group_china_trip",
    name: "중국출장",
    tags: [
      tagDefinition("tag_trip_process", "처리", "group_china_trip", 1),
      tagDefinition("tag_trip_confirm", "확인", "group_china_trip", 2),
      tagDefinition("tag_trip_check", "체크", "group_china_trip", 3),
      tagDefinition("tag_trip_hold", "보류", "group_china_trip", 4),
    ],
  },
];

const GROUP_ID_ALIASES = {
  store: "group_store",
  china: "group_china",
  office: "group_office",
  chinaTrip: "group_china_trip",
};
const TRIP_GROUP_ID = "group_china_trip";
const DEFAULT_TRIP_LOCATIONS = ["이우 시장 1기", "스카프거리", "사무실", "2기"];

const state = {
  groups: structuredClone(DEFAULT_GROUPS),
  tripLocations: [...DEFAULT_TRIP_LOCATIONS],
  logs: [],
  selectedGroupId: "group_store",
  selectedTagId: "tag_store_shipping",
  selectedTripLocation: DEFAULT_TRIP_LOCATIONS[0],
  tagDraftGroups: null,
  tagPendingMoves: [],
  tagSettingsDirty: false,
  migrationErrors: [],
  draggingTripLocation: "",
  tripLocationDragMoved: false,
  module: "logs",
  status: "active",
  search: "",
  tagFilter: "",
  locationFilter: "",
  listGroupFilter: "",
  sortMode: "created-desc",
  selectedIds: new Set(),
  pendingDeleteIds: [],
  pendingTagDelete: null,
  pendingShareText: "",
  deferredInstallPrompt: null,
  orderFields: structuredClone(DEFAULT_ORDER_FIELDS),
  orderProducts: [],
  orderCart: [],
  orderHistory: [],
  selectedOrderHistoryIds: new Set(),
  orderSearch: "",
  orderHistorySearch: "",
  selectedOrderProductId: "",
  orderMarkers: [],
  generatedOrderPages: [],
  pendingShareTitle: "업무 로그",
  cloud: {
    url: "",
    anonKey: "",
    email: "",
    enabled: false,
    user: null,
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
    isSyncing: false,
    lastSyncAt: null,
    pushTimer: null,
    autoSyncTimer: null,
    retryTimer: null,
    retryDelayMs: CLOUD_RETRY_DELAY_MS,
    hasPendingChanges: false,
    pendingSince: null,
    lastErrorAt: null,
    lastErrorMessage: "",
  },
};

const els = {};
const orderImageUrlCache = new Map();

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  loadState();
  loadCloudConfig();
  loadOrderBoard();
  normalizeSelection();
  bindEvents();
  setLoginEmailInputs(state.cloud.email || getSavedEmail());
  render();
  initializeCloudSession();
  registerServiceWorker();
});

function bindElements() {
  Object.assign(els, {
    groupPicker: document.querySelector("#groupPicker"),
    listGroupPicker: document.querySelector("#listGroupPicker"),
    tagPicker: document.querySelector("#tagPicker"),
    tripLocationField: document.querySelector("#tripLocationField"),
    tripLocationPicker: document.querySelector("#tripLocationPicker"),
    logForm: document.querySelector("#logForm"),
    memoInput: document.querySelector("#memoInput"),
    searchInput: document.querySelector("#searchInput"),
    tagFilter: document.querySelector("#tagFilter"),
    tripLocationFilterWrap: document.querySelector("#tripLocationFilterWrap"),
    tripLocationFilter: document.querySelector("#tripLocationFilter"),
    sortSelect: document.querySelector("#sortSelect"),
    logList: document.querySelector("#logList"),
    statusCounts: document.querySelector("#statusCounts"),
    batchBar: document.querySelector("#batchBar"),
    selectedCount: document.querySelector("#selectedCount"),
    batchTarget: document.querySelector("#batchTarget"),
    applyBatchBtn: document.querySelector("#applyBatchBtn"),
    batchShipAction: document.querySelector("#batchShipAction"),
    batchShipBtn: document.querySelector("#batchShipBtn"),
    batchReopenBtn: document.querySelector("#batchReopenBtn"),
    batchDeleteBtn: document.querySelector("#batchDeleteBtn"),
    batchRestoreBtn: document.querySelector("#batchRestoreBtn"),
    clearSelectionBtn: document.querySelector("#clearSelectionBtn"),
    selectAllBtn: document.querySelector("#selectAllBtn"),
    emptyTrashBtn: document.querySelector("#emptyTrashBtn"),
    settingsGroups: document.querySelector("#settingsGroups"),
    tagSettingsStatus: document.querySelector("#tagSettingsStatus"),
    saveTagSettingsBtn: document.querySelector("#saveTagSettingsBtn"),
    cancelTagSettingsBtn: document.querySelector("#cancelTagSettingsBtn"),
    tripLocationList: document.querySelector("#tripLocationList"),
    newTripLocationInput: document.querySelector("#newTripLocationInput"),
    addTripLocationBtn: document.querySelector("#addTripLocationBtn"),
    authGate: document.querySelector("#authGate"),
    authStatus: document.querySelector("#authStatus"),
    authForm: document.querySelector("#authForm"),
    authEmailInput: document.querySelector("#authEmailInput"),
    authPasswordInput: document.querySelector("#authPasswordInput"),
    authLoginBtn: document.querySelector("#authLoginBtn"),
    authSignupBtn: document.querySelector("#authSignupBtn"),
    syncPill: document.querySelector("#syncPill"),
    cloudStatus: document.querySelector("#cloudStatus"),
    cloudUrlInput: document.querySelector("#cloudUrlInput"),
    cloudAnonKeyInput: document.querySelector("#cloudAnonKeyInput"),
    cloudEmailInput: document.querySelector("#cloudEmailInput"),
    cloudPasswordInput: document.querySelector("#cloudPasswordInput"),
    saveCloudConfigBtn: document.querySelector("#saveCloudConfigBtn"),
    cloudSignupBtn: document.querySelector("#cloudSignupBtn"),
    cloudLoginBtn: document.querySelector("#cloudLoginBtn"),
    cloudSyncBtn: document.querySelector("#cloudSyncBtn"),
    cloudLogoutBtn: document.querySelector("#cloudLogoutBtn"),
    exportJsonBtn: document.querySelector("#exportJsonBtn"),
    exportCsvBtn: document.querySelector("#exportCsvBtn"),
    importJsonInput: document.querySelector("#importJsonInput"),
    shareVisibleBtn: document.querySelector("#shareVisibleBtn"),
    shareModal: document.querySelector("#shareModal"),
    sharePreview: document.querySelector("#sharePreview"),
    shareKakaoBtn: document.querySelector("#shareKakaoBtn"),
    shareSmsBtn: document.querySelector("#shareSmsBtn"),
    shareNativeBtn: document.querySelector("#shareNativeBtn"),
    copyShareBtn: document.querySelector("#copyShareBtn"),
    installBtn: document.querySelector("#installBtn"),
    toast: document.querySelector("#toast"),
    moveModal: document.querySelector("#moveModal"),
    moveLogId: document.querySelector("#moveLogId"),
    moveTarget: document.querySelector("#moveTarget"),
    saveMoveBtn: document.querySelector("#saveMoveBtn"),
    shipModal: document.querySelector("#shipModal"),
    shipLogId: document.querySelector("#shipLogId"),
    feedbackModal: document.querySelector("#feedbackModal"),
    feedbackLogId: document.querySelector("#feedbackLogId"),
    feedbackMemo: document.querySelector("#feedbackMemo"),
    createStoreContactBtn: document.querySelector("#createStoreContactBtn"),
    deleteModal: document.querySelector("#deleteModal"),
    deleteSummary: document.querySelector("#deleteSummary"),
    deletePreview: document.querySelector("#deletePreview"),
    confirmDeleteBtn: document.querySelector("#confirmDeleteBtn"),
    emptyTrashModal: document.querySelector("#emptyTrashModal"),
    emptyTrashSummary: document.querySelector("#emptyTrashSummary"),
    confirmEmptyTrashBtn: document.querySelector("#confirmEmptyTrashBtn"),
    tagDeleteModal: document.querySelector("#tagDeleteModal"),
    tagDeleteSummary: document.querySelector("#tagDeleteSummary"),
    tagDeleteMoveArea: document.querySelector("#tagDeleteMoveArea"),
    tagDeleteTarget: document.querySelector("#tagDeleteTarget"),
    tagDeleteNote: document.querySelector("#tagDeleteNote"),
    deleteTagKeepBtn: document.querySelector("#deleteTagKeepBtn"),
    deleteTagMoveBtn: document.querySelector("#deleteTagMoveBtn"),
    orderImageCounts: document.querySelector("#orderImageCounts"),
    imageOrderModeBtn: document.querySelector("#imageOrderModeBtn"),
    textOrderModeBtn: document.querySelector("#textOrderModeBtn"),
    existingOrderModeBtn: document.querySelector("#existingOrderModeBtn"),
    textOrderForm: document.querySelector("#textOrderForm"),
    textOrderProductInput: document.querySelector("#textOrderProductInput"),
    textOrderFactoryInput: document.querySelector("#textOrderFactoryInput"),
    textOrderCustomerInput: document.querySelector("#textOrderCustomerInput"),
    textOrderQuantityInput: document.querySelector("#textOrderQuantityInput"),
    textOrderPriceInput: document.querySelector("#textOrderPriceInput"),
    textOrderDueDateInput: document.querySelector("#textOrderDueDateInput"),
    textOrderCategorySelect: document.querySelector("#textOrderCategorySelect"),
    textOrderStatusSelect: document.querySelector("#textOrderStatusSelect"),
    textOrderMemoInput: document.querySelector("#textOrderMemoInput"),
    textOrderSourceLogInput: document.querySelector("#textOrderSourceLogInput"),
    saveShareTextOrderBtn: document.querySelector("#saveShareTextOrderBtn"),
    clearTextOrderBtn: document.querySelector("#clearTextOrderBtn"),
    orderHistorySearchInput: document.querySelector("#orderHistorySearchInput"),
    productImageInput: document.querySelector("#productImageInput"),
    bulkProductName: document.querySelector("#bulkProductName"),
    bulkFactory: document.querySelector("#bulkFactory"),
    bulkPrice: document.querySelector("#bulkPrice"),
    bulkMoq: document.querySelector("#bulkMoq"),
    bulkSearch: document.querySelector("#bulkSearch"),
    bulkMemo: document.querySelector("#bulkMemo"),
    applyBulkToProductsBtn: document.querySelector("#applyBulkToProductsBtn"),
    clearBulkBtn: document.querySelector("#clearBulkBtn"),
    productFieldList: document.querySelector("#productFieldList"),
    newFieldNameInput: document.querySelector("#newFieldNameInput"),
    addProductFieldBtn: document.querySelector("#addProductFieldBtn"),
    productSearchInput: document.querySelector("#productSearchInput"),
    productList: document.querySelector("#productList"),
    orderEditorStatus: document.querySelector("#orderEditorStatus"),
    imageMarkBoard: document.querySelector("#imageMarkBoard"),
    orderEditImage: document.querySelector("#orderEditImage"),
    markerLayer: document.querySelector("#markerLayer"),
    emptyBoardHint: document.querySelector("#emptyBoardHint"),
    addToCartBtn: document.querySelector("#addToCartBtn"),
    clearMarkersBtn: document.querySelector("#clearMarkersBtn"),
    orderCartList: document.querySelector("#orderCartList"),
    orderGridSize: document.querySelector("#orderGridSize"),
    generatedOrderCategorySelect: document.querySelector("#generatedOrderCategorySelect"),
    generateOrderImagesBtn: document.querySelector("#generateOrderImagesBtn"),
    clearCartBtn: document.querySelector("#clearCartBtn"),
    generatedOrderPages: document.querySelector("#generatedOrderPages"),
    existingOrderImageInput: document.querySelector("#existingOrderImageInput"),
    existingOrderCategorySelect: document.querySelector("#existingOrderCategorySelect"),
    existingOrderProductInput: document.querySelector("#existingOrderProductInput"),
    existingOrderFactoryInput: document.querySelector("#existingOrderFactoryInput"),
    existingOrderSearchInput: document.querySelector("#existingOrderSearchInput"),
    existingOrderMemoInput: document.querySelector("#existingOrderMemoInput"),
    saveExistingOrderBtn: document.querySelector("#saveExistingOrderBtn"),
    orderHistoryList: document.querySelector("#orderHistoryList"),
  });
}

function ensureOrderElements() {
  const selectors = {
    orderImageCounts: "#orderImageCounts",
    imageOrderModeBtn: "#imageOrderModeBtn",
    textOrderModeBtn: "#textOrderModeBtn",
    existingOrderModeBtn: "#existingOrderModeBtn",
    textOrderForm: "#textOrderForm",
    textOrderProductInput: "#textOrderProductInput",
    textOrderFactoryInput: "#textOrderFactoryInput",
    textOrderCustomerInput: "#textOrderCustomerInput",
    textOrderQuantityInput: "#textOrderQuantityInput",
    textOrderPriceInput: "#textOrderPriceInput",
    textOrderDueDateInput: "#textOrderDueDateInput",
    textOrderCategorySelect: "#textOrderCategorySelect",
    textOrderStatusSelect: "#textOrderStatusSelect",
    textOrderMemoInput: "#textOrderMemoInput",
    textOrderSourceLogInput: "#textOrderSourceLogInput",
    saveShareTextOrderBtn: "#saveShareTextOrderBtn",
    clearTextOrderBtn: "#clearTextOrderBtn",
    orderHistorySearchInput: "#orderHistorySearchInput",
    productImageInput: "#productImageInput",
    bulkProductName: "#bulkProductName",
    bulkFactory: "#bulkFactory",
    bulkPrice: "#bulkPrice",
    bulkMoq: "#bulkMoq",
    bulkSearch: "#bulkSearch",
    bulkMemo: "#bulkMemo",
    applyBulkToProductsBtn: "#applyBulkToProductsBtn",
    clearBulkBtn: "#clearBulkBtn",
    productFieldList: "#productFieldList",
    newFieldNameInput: "#newFieldNameInput",
    addProductFieldBtn: "#addProductFieldBtn",
    productSearchInput: "#productSearchInput",
    productList: "#productList",
    orderEditorStatus: "#orderEditorStatus",
    imageMarkBoard: "#imageMarkBoard",
    orderEditImage: "#orderEditImage",
    markerLayer: "#markerLayer",
    emptyBoardHint: "#emptyBoardHint",
    addToCartBtn: "#addToCartBtn",
    clearMarkersBtn: "#clearMarkersBtn",
    orderCartList: "#orderCartList",
    orderGridSize: "#orderGridSize",
    generatedOrderCategorySelect: "#generatedOrderCategorySelect",
    generateOrderImagesBtn: "#generateOrderImagesBtn",
    clearCartBtn: "#clearCartBtn",
    generatedOrderPages: "#generatedOrderPages",
    existingOrderImageInput: "#existingOrderImageInput",
    existingOrderCategorySelect: "#existingOrderCategorySelect",
    existingOrderProductInput: "#existingOrderProductInput",
    existingOrderFactoryInput: "#existingOrderFactoryInput",
    existingOrderSearchInput: "#existingOrderSearchInput",
    existingOrderMemoInput: "#existingOrderMemoInput",
    saveExistingOrderBtn: "#saveExistingOrderBtn",
    orderHistoryList: "#orderHistoryList",
  };
  Object.entries(selectors).forEach(([key, selector]) => {
    if (!els[key]) els[key] = document.querySelector(selector);
  });
}

function bindEvents() {
  document.querySelectorAll(".module-tab[data-module]").forEach((button) => {
    button.addEventListener("click", () => {
      state.module = button.dataset.module;
      if (state.module === "settings") beginTagSettingsEdit();
      render();
    });
  });

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      state.selectedIds.clear();
      renderLogs();
      renderBatchBar();
    });
  });

  els.logForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const memo = els.memoInput.value.trim();
    if (!memo) {
      showToast("메모를 입력하세요.");
        return;
    }
    focusLogViewOnSelectedTag();
    addLog(state.selectedGroupId, state.selectedTagId, memo, "신규 입력", {
      location: isTripGroup(state.selectedGroupId) ? state.selectedTripLocation : "",
    });
    els.memoInput.value = "";
    els.memoInput.focus();
    showToast("저장했습니다.");
  });

  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value.trim();
    renderLogs();
  });

  els.tagFilter.addEventListener("change", () => {
    state.tagFilter = els.tagFilter.value;
    syncSelectionFromTagFilter();
    state.selectedIds.clear();
    render();
  });

  els.tripLocationFilter?.addEventListener("change", () => {
    state.locationFilter = els.tripLocationFilter.value;
    state.selectedIds.clear();
    renderLogs();
    renderBatchBar();
  });

  els.sortSelect.addEventListener("change", () => {
    state.sortMode = els.sortSelect.value;
    renderLogs();
  });

  els.selectAllBtn.addEventListener("click", () => {
    const visible = getFilteredLogs();
    const allSelected = visible.length > 0 && visible.every((log) => state.selectedIds.has(log.id));
    if (allSelected) {
      visible.forEach((log) => state.selectedIds.delete(log.id));
    } else {
      visible.forEach((log) => state.selectedIds.add(log.id));
    }
    renderLogs();
    renderBatchBar();
  });

  els.clearSelectionBtn.addEventListener("click", () => {
    state.selectedIds.clear();
    renderLogs();
    renderBatchBar();
  });

  els.applyBatchBtn.addEventListener("click", () => {
    const target = parseTargetValue(els.batchTarget.value);
    const count = state.selectedIds.size;
    if (!count || !target.groupId || !target.tagId) return;
    state.logs = state.logs.map((log) => {
      if (!state.selectedIds.has(log.id)) return log;
      return moveLog(log, target.groupId, target.tagId, "일괄 변경");
    });
    state.selectedIds.clear();
    persist();
    render();
    showToast(`${count}건을 변경했습니다.`);
  });

  els.batchShipBtn?.addEventListener("click", () => {
    const action = els.batchShipAction?.value || "complete";
    const count = processStoreShipLogs([...state.selectedIds], action);
    if (count) showToast(`${count}건을 ${STORE_SHIP_ACTION_LABELS[action] || "출고 처리"}로 처리했습니다.`);
  });

  els.batchReopenBtn?.addEventListener("click", () => {
    const count = reopenLogs([...state.selectedIds]);
    showToast(`${count}건을 진행중으로 옮겼습니다.`);
  });

  els.batchDeleteBtn.addEventListener("click", () => {
    openDeleteModal([...state.selectedIds]);
  });

  els.batchRestoreBtn.addEventListener("click", () => {
    const count = restoreLogs([...state.selectedIds]);
    showToast(`${count}건을 복원했습니다.`);
  });

  els.saveMoveBtn.addEventListener("click", () => {
    const id = els.moveLogId.value;
    const target = parseTargetValue(els.moveTarget.value);
    if (!target.groupId || !target.tagId) return;
    state.logs = state.logs.map((log) =>
      log.id === id ? moveLog(log, target.groupId, target.tagId, "직접 변경") : log,
    );
    persist();
    els.moveModal.close();
    render();
    showToast("변경했습니다.");
  });

  document.querySelectorAll("[data-ship-action]").forEach((button) => {
    button.addEventListener("click", () => handleShipAction(button.dataset.shipAction));
  });

  els.createStoreContactBtn.addEventListener("click", () => {
    const source = getLogById(els.feedbackLogId.value);
    if (!source) return;
    const extra = els.feedbackMemo.value.trim();
    const memo = extra ? `${source.memo}\n피드백: ${extra}` : source.memo;
    addLog("매장", "연락", memo, `중국 / 피드백대기에서 생성`);
    completeLog(source.id, "매장 연락 생성");
    els.feedbackMemo.value = "";
    els.feedbackModal.close();
    render();
    showToast("매장 연락을 생성했습니다.");
  });

  els.confirmDeleteBtn.addEventListener("click", () => {
    const count = moveLogsToTrash(state.pendingDeleteIds);
    state.pendingDeleteIds = [];
    els.deleteModal.close();
    showToast(`${count}건을 휴지통으로 이동했습니다.`);
  });

  els.emptyTrashBtn.addEventListener("click", () => {
    const count = state.logs.filter((log) => log.deletedAt).length;
    if (!count) {
      showToast("휴지통이 비어 있습니다.");
      return;
    }
    els.emptyTrashSummary.textContent = `휴지통의 ${count}건을 완전 삭제할까요?`;
    els.emptyTrashModal.showModal();
  });

  els.confirmEmptyTrashBtn.addEventListener("click", () => {
    const count = emptyTrash();
    els.emptyTrashModal.close();
    showToast(`${count}건을 완전 삭제했습니다.`);
  });
  els.deleteTagKeepBtn?.addEventListener("click", () => deletePendingTag({ moveLogs: false }));
  els.deleteTagMoveBtn?.addEventListener("click", () => deletePendingTag({ moveLogs: true }));
  els.saveTagSettingsBtn?.addEventListener("click", saveTagSettings);
  els.cancelTagSettingsBtn?.addEventListener("click", cancelTagSettings);

  els.saveCloudConfigBtn.addEventListener("click", () => {
    saveCloudConfigFromForm();
    renderCloudSettings();
    showToast("클라우드 설정을 저장했습니다.");
  });
  els.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    cloudLogin("auth");
  });
  bindRememberEmailInput(els.authEmailInput);
  bindRememberEmailInput(els.cloudEmailInput);
  els.authSignupBtn.addEventListener("click", () => cloudSignup("auth"));
  els.cloudSignupBtn.addEventListener("click", () => cloudSignup("settings"));
  els.cloudLoginBtn.addEventListener("click", () => cloudLogin("settings"));
  els.cloudSyncBtn.addEventListener("click", () => syncCloud({ showDone: true }));
  els.cloudLogoutBtn.addEventListener("click", () => cloudLogout());
  els.addTripLocationBtn?.addEventListener("click", addTripLocationFromInput);
  ensureOrderElements();
  els.productImageInput?.addEventListener("change", handleProductImageUpload);
  els.applyBulkToProductsBtn?.addEventListener("click", applyBulkToProducts);
  els.clearBulkBtn?.addEventListener("click", clearBulkInputs);
  els.addProductFieldBtn?.addEventListener("click", addProductField);
  els.imageOrderModeBtn?.addEventListener("click", () => focusOrderArea("image"));
  els.textOrderModeBtn?.addEventListener("click", () => focusOrderArea("text"));
  els.existingOrderModeBtn?.addEventListener("click", () => focusOrderArea("existing"));
  els.textOrderForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTextOrder({ share: false });
  });
  els.saveShareTextOrderBtn?.addEventListener("click", () => saveTextOrder({ share: true }));
  els.clearTextOrderBtn?.addEventListener("click", clearTextOrderForm);
  els.orderHistorySearchInput?.addEventListener("input", () => {
    state.orderHistorySearch = els.orderHistorySearchInput.value.trim();
    state.selectedOrderHistoryIds.clear();
    renderOrderHistory();
  });
  els.productSearchInput?.addEventListener("input", () => {
    state.orderSearch = els.productSearchInput.value.trim();
    renderOrderBoard();
  });
  els.imageMarkBoard?.addEventListener("click", addOrderMarker);
  els.addToCartBtn?.addEventListener("click", addSelectedProductToCart);
  els.clearMarkersBtn?.addEventListener("click", () => {
    state.orderMarkers = [];
    renderOrderEditor();
  });
  els.generateOrderImagesBtn?.addEventListener("click", generateOrderImages);
  els.clearCartBtn?.addEventListener("click", clearOrderCart);
  els.saveExistingOrderBtn?.addEventListener("click", saveExistingOrderImages);
  els.exportJsonBtn.addEventListener("click", exportJson);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.importJsonInput.addEventListener("change", importJson);
  els.shareVisibleBtn.addEventListener("click", () => shareLogs(getFilteredLogs()));
  els.shareKakaoBtn.addEventListener("click", () => shareToKakao());
  els.shareSmsBtn.addEventListener("click", () => shareToSms());
  els.shareNativeBtn.addEventListener("click", () => shareBySystem());
  els.copyShareBtn.addEventListener("click", () => copyShareText());
  els.installBtn.addEventListener("click", installApp);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    els.installBtn.hidden = false;
  });

  window.addEventListener("online", () => resumeCloudWork({ force: true }));
  window.addEventListener("offline", renderCloudSettings);
  window.addEventListener("focus", () => resumeCloudWork({ force: true }));
  window.addEventListener("pagehide", flushCloudPush);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushCloudPush();
    else resumeCloudWork({ force: true });
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved) return;
    const needsMigration = saved.tagSchemaVersion !== TAG_SCHEMA_VERSION || hasLegacyTagData(saved);
    if (needsMigration && !localStorage.getItem(TAG_MIGRATION_BACKUP_KEY)) {
      localStorage.setItem(
        TAG_MIGRATION_BACKUP_KEY,
        JSON.stringify({ backedUpAt: new Date().toISOString(), source: saved }),
      );
    }
    state.groups = normalizeStoredGroups(saved.groups);
    state.tripLocations = mergeTripLocations(saved.tripLocations || getTripLocationsFromGroups(state.groups));
    state.migrationErrors = [];
    state.logs = normalizeStoredLogs(saved.logs, state.groups, state.migrationErrors);
    if (state.migrationErrors.length) {
      localStorage.setItem(TAG_MIGRATION_ERRORS_KEY, JSON.stringify(state.migrationErrors));
    }
    if (needsMigration) persist({ skipCloud: true });
  } catch (error) {
    state.migrationErrors = [{ at: new Date().toISOString(), reason: error?.message || "저장 데이터 읽기 실패" }];
  }
}

function loadCloudConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY));
    if (!saved) {
      applyDefaultCloudConfig();
      return;
    }
    state.cloud.url = saved.url || DEFAULT_CLOUD_URL;
    state.cloud.anonKey = saved.anonKey || DEFAULT_CLOUD_ANON_KEY;
    state.cloud.email = normalizeEmail(saved.email || saved.user?.email || getSavedEmail());
    state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
    state.cloud.user = saved.user || null;
    state.cloud.accessToken = saved.accessToken || "";
    state.cloud.refreshToken = saved.refreshToken || "";
    state.cloud.expiresAt = saved.expiresAt || 0;
    state.cloud.lastSyncAt = saved.lastSyncAt || null;
    state.cloud.hasPendingChanges = Boolean(saved.hasPendingChanges);
    state.cloud.pendingSince = saved.pendingSince || null;
    state.cloud.lastErrorAt = saved.lastErrorAt || null;
    state.cloud.lastErrorMessage = saved.lastErrorMessage || "";
  } catch {
    applyDefaultCloudConfig();
  }
}

function loadOrderBoard() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_BOARD_KEY));
    if (!saved) return;
    state.orderFields = mergeOrderFields(saved.fields);
    state.orderProducts = Array.isArray(saved.products) ? saved.products : [];
    state.orderCart = Array.isArray(saved.cart) ? saved.cart : [];
    state.orderHistory = Array.isArray(saved.history) ? saved.history.map(normalizeOrderHistoryEntry) : [];
  } catch {
    state.orderFields = structuredClone(DEFAULT_ORDER_FIELDS);
    state.orderProducts = [];
    state.orderCart = [];
    state.orderHistory = [];
  }
}

function persistOrderBoard(options = {}) {
  const storedProducts = state.orderProducts.map(({ imageData, ...product }) => product);
  const storedCart = state.orderCart.map(({ imageData, ...item }) => item);
  const storedHistory = state.orderHistory.map(({ pageData, ...entry }) => entry);
  try {
    localStorage.setItem(
      ORDER_BOARD_KEY,
      JSON.stringify({
        fields: state.orderFields,
        products: storedProducts,
        cart: storedCart,
        history: storedHistory,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    showToast("이미지 저장 공간이 부족합니다. 불필요한 이미지를 정리해 주세요.");
  }
  if (!options.skipCloud) scheduleCloudPush();
}

function mergeOrderFields(savedFields) {
  const incoming = Array.isArray(savedFields) ? savedFields.filter((field) => field?.id && field?.label) : [];
  const byId = new Map(incoming.map((field) => [field.id, field]));
  const merged = DEFAULT_ORDER_FIELDS.map((field) => ({ ...field, ...(byId.get(field.id) || {}) }));
  incoming.forEach((field) => {
    if (!DEFAULT_ORDER_FIELDS.some((defaultField) => defaultField.id === field.id)) merged.push(field);
  });
  return merged;
}

function normalizeOrderHistoryEntry(entry) {
  if (!entry?.id) return entry;
  const item = Array.isArray(entry.items) ? entry.items[0] || {} : {};
  const category = normalizeOrderCategory(entry.category || item.category);
  const deliveryStatus = normalizeOrderDeliveryStatus(entry.deliveryStatus || item.deliveryStatus);
  const deliveredAt = entry.deliveredAt || item.deliveredAt || "";
  return {
    ...entry,
    category,
    deliveryStatus,
    deliveredAt,
    status: entry.status || item.status || "발주완료",
    customer: entry.customer || item.customer || "",
    quantity: entry.quantity || item.quantity || "",
    price: entry.price || item.price || "",
    dueDate: entry.dueDate || item.dueDate || "",
    sourceLogId: entry.sourceLogId || item.sourceLogId || "",
    items: Array.isArray(entry.items)
      ? entry.items.map((historyItem) => ({
          ...historyItem,
          category: normalizeOrderCategory(historyItem.category || category),
          deliveryStatus: normalizeOrderDeliveryStatus(historyItem.deliveryStatus || deliveryStatus),
          deliveredAt: historyItem.deliveredAt || deliveredAt,
        }))
      : [],
    pages: Array.isArray(entry.pages) ? entry.pages : [],
  };
}

function normalizeOrderCategory(category) {
  return ORDER_CATEGORY_OPTIONS.includes(category) ? category : DEFAULT_ORDER_CATEGORY;
}

function normalizeOrderDeliveryStatus(status) {
  return ORDER_DELIVERY_OPTIONS.includes(status) ? status : DEFAULT_ORDER_DELIVERY_STATUS;
}

function applyDefaultCloudConfig() {
  state.cloud.url = DEFAULT_CLOUD_URL;
  state.cloud.anonKey = DEFAULT_CLOUD_ANON_KEY;
  state.cloud.email = getSavedEmail();
  state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
  state.cloud.user = null;
  state.cloud.accessToken = "";
  state.cloud.refreshToken = "";
  state.cloud.expiresAt = 0;
  state.cloud.lastSyncAt = null;
  state.cloud.hasPendingChanges = false;
  state.cloud.pendingSince = null;
  state.cloud.lastErrorAt = null;
  state.cloud.lastErrorMessage = "";
  state.cloud.retryDelayMs = CLOUD_RETRY_DELAY_MS;
}

function saveCloudConfig() {
  const email = normalizeEmail(state.cloud.email || state.cloud.user?.email || getSavedEmail());
  if (email) rememberEmail(email);
  localStorage.setItem(
    CLOUD_CONFIG_KEY,
    JSON.stringify({
      url: state.cloud.url,
      anonKey: state.cloud.anonKey,
      email,
      enabled: Boolean(state.cloud.enabled),
      user: state.cloud.user,
      accessToken: state.cloud.accessToken,
      refreshToken: state.cloud.refreshToken,
      expiresAt: state.cloud.expiresAt,
      lastSyncAt: state.cloud.lastSyncAt,
      hasPendingChanges: Boolean(state.cloud.hasPendingChanges),
      pendingSince: state.cloud.pendingSince,
      lastErrorAt: state.cloud.lastErrorAt,
      lastErrorMessage: state.cloud.lastErrorMessage,
      savedAt: new Date().toISOString(),
    }),
  );
}

function hasLegacyTagData(saved) {
  const groups = Array.isArray(saved?.groups) ? saved.groups : [];
  const logs = Array.isArray(saved?.logs) ? saved.logs : [];
  return (
    groups.some((group) => !Array.isArray(group?.tags) || group.tags.some((tag) => typeof tag === "string" || !tag?.id)) ||
    logs.some((log) => !log?.groupId || !log?.tagId || "group" in log || "tag" in log || "tagName" in log)
  );
}

function canonicalGroupId(group) {
  const rawId = String(group?.id || group?.groupId || "").trim();
  const aliasedId = GROUP_ID_ALIASES[rawId] || rawId;
  const matchedDefault = DEFAULT_GROUPS.find((item) => item.id === aliasedId || item.name === group?.name);
  if (matchedDefault) return matchedDefault.id;
  if (aliasedId) return aliasedId.startsWith("group_") ? aliasedId : `group_${aliasedId}`;
  return `group_${stableTextHash(group?.name || crypto.randomUUID())}`;
}

function stableTextHash(value) {
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function migratedTagId(groupId, name) {
  return `tag_migrated_${groupId.replace(/^group_/, "")}_${stableTextHash(name)}`;
}

function defaultTagFor(groupId, name) {
  return DEFAULT_GROUPS.find((group) => group.id === groupId)?.tags.find((tag) => tag.name === name);
}

function normalizeTagDefinition(tag, groupId, index) {
  const source = typeof tag === "string" ? { name: tag } : tag || {};
  const name = String(source.name || source.label || "").trim();
  if (!name) return null;
  const defaultTag = defaultTagFor(groupId, name);
  const id = String(source.id || defaultTag?.id || migratedTagId(groupId, name));
  return {
    id,
    name,
    groupId,
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : index + 1,
    isActive: source.isActive !== false,
  };
}

function normalizeStoredGroups(savedGroups) {
  const incoming = Array.isArray(savedGroups) ? savedGroups.filter((group) => group?.name || group?.id) : [];
  if (!incoming.length) return structuredClone(DEFAULT_GROUPS);

  const normalized = incoming.map((group) => {
    const groupId = canonicalGroupId(group);
    const defaultGroup = DEFAULT_GROUPS.find((item) => item.id === groupId);
    const sourceTags = Array.isArray(group.tags) && group.tags.length ? group.tags : defaultGroup?.tags || [];
    const seenIds = new Set();
    const seenNames = new Set();
    const tags = sourceTags
      .map((tag, index) => normalizeTagDefinition(tag, groupId, index))
      .filter((tag) => {
        const nameKey = tag?.name.toLocaleLowerCase("ko");
        if (!tag || seenIds.has(tag.id) || seenNames.has(nameKey)) return false;
        seenIds.add(tag.id);
        seenNames.add(nameKey);
        return true;
      })
      .sort((a, b) => a.order - b.order)
      .map((tag, index) => ({ ...tag, order: index + 1 }));
    return {
      ...group,
      id: groupId,
      name: defaultGroup?.name || String(group.name || groupId),
      tags: tags.length ? tags : structuredClone(defaultGroup?.tags || []),
    };
  });

  DEFAULT_GROUPS.forEach((defaultGroup) => {
    if (!normalized.some((group) => group.id === defaultGroup.id)) normalized.push(structuredClone(defaultGroup));
  });
  return normalized;
}

function normalizeStoredLogs(savedLogs, groups, errors = []) {
  if (!Array.isArray(savedLogs)) return [];
  return savedLogs.map((log) => normalizeLogRecord(log, groups, errors)).filter(Boolean);
}

function normalizeLogRecord(log, groups = state.groups, errors = state.migrationErrors) {
  if (!log || typeof log !== "object") return null;
  const groupRef = log.groupId || log.group;
  let group = findGroup(groupRef, groups);
  if (!group) {
    const groupName = String(log.group || groupRef || "미확인 그룹");
    group = { id: `group_recovered_${stableTextHash(groupName)}`, name: groupName, tags: [] };
    groups.push(group);
    errors.push({ logId: log.id || "", reason: `그룹 자동 복구: ${groupName}` });
  }

  const tagRef = log.tagId || log.tag || log.tagName;
  let tag = findTag(group, tagRef, { includeInactive: true });
  if (!tag) {
    const tagName = String(log.tag || log.tagName || tagRef || "미확인 태그");
    tag = {
      id: migratedTagId(group.id, tagName),
      name: tagName,
      groupId: group.id,
      order: group.tags.length + 1,
      isActive: false,
    };
    group.tags.push(tag);
    errors.push({ logId: log.id || "", reason: `태그 자동 복구: ${group.name} / ${tagName}` });
  }
  const { group: legacyGroup, tag: legacyTag, tagName: legacyTagName, ...rest } = log;
  return { ...rest, groupId: group.id, tagId: tag.id };
}

function findGroup(ref, groups = state.groups) {
  const value = String(ref || "");
  const canonical = GROUP_ID_ALIASES[value] || value;
  return (Array.isArray(groups) ? groups : []).find((group) => group.id === canonical || group.name === value);
}

function orderedTags(group, options = {}) {
  const includeInactive = Boolean(options.includeInactive);
  return (Array.isArray(group?.tags) ? group.tags : [])
    .filter((tag) => includeInactive || tag.isActive !== false)
    .sort((a, b) => a.order - b.order);
}

function findTag(group, ref, options = {}) {
  const value = String(ref || "");
  return orderedTags(group, { includeInactive: options.includeInactive !== false }).find(
    (tag) => tag.id === value || tag.name === value,
  );
}

function createTagId() {
  return `tag_${crypto.randomUUID()}`;
}

function getTripGroup() {
  return findGroup(TRIP_GROUP_ID);
}

function isTripGroup(groupRef) {
  return findGroup(groupRef)?.id === TRIP_GROUP_ID;
}

function mergeTripLocations(locations) {
  const merged = [];
  (Array.isArray(locations) ? locations : []).forEach((location) => {
    const normalized = String(location || "").trim();
    if (normalized && !merged.includes(normalized)) merged.push(normalized);
  });
  return merged.length ? merged : [...DEFAULT_TRIP_LOCATIONS];
}

function getTripLocationsFromGroups(groups) {
  const tripGroup = (Array.isArray(groups) ? groups : []).find((group) => group?.id === TRIP_GROUP_ID || group?.name === "중국출장");
  return Array.isArray(tripGroup?.locations) ? tripGroup.locations : [];
}

function decorateGroupsWithTripLocations(groups) {
  return (Array.isArray(groups) ? groups : []).map((group) =>
    group?.id === TRIP_GROUP_ID || group?.name === "중국출장" ? { ...group, locations: state.tripLocations } : group,
  );
}

function persist(options = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      tagSchemaVersion: TAG_SCHEMA_VERSION,
      groups: decorateGroupsWithTripLocations(state.groups),
      tripLocations: state.tripLocations,
      logs: state.logs,
      savedAt: new Date().toISOString(),
    }),
  );
  if (!options.skipCloud) scheduleCloudPush();
}

function normalizeSelection() {
  const group = findGroup(state.selectedGroupId) || state.groups[0];
  const tags = orderedTags(group);
  state.selectedGroupId = group.id;
  state.selectedTagId = tags.some((tag) => tag.id === state.selectedTagId) ? state.selectedTagId : tags[0]?.id || "";
  state.tripLocations = mergeTripLocations(state.tripLocations);
  if (!state.tripLocations.includes(state.selectedTripLocation)) state.selectedTripLocation = state.tripLocations[0];
}

function render() {
  const signedIn = isCloudSignedIn();
  document.body.classList.toggle("is-authenticated", signedIn);
  document.querySelectorAll(".module-tab[data-module]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.module === state.module);
  });
  document.querySelector("#logsModule").classList.toggle("is-visible", state.module === "logs");
  document.querySelector("#orderImageModule").classList.toggle("is-visible", state.module === "orderImage");
  document.querySelector("#settingsModule").classList.toggle("is-visible", state.module === "settings");

  renderOrderBoard();
  renderAuthGate();
  renderPickers();
  renderFilters();
  renderCounts();
  renderLogs();
  renderBatchBar();
  renderSettings();
  renderCloudSettings();
}

function isCloudSignedIn() {
  const localUiTest = ["127.0.0.1", "localhost"].includes(location.hostname) &&
    new URLSearchParams(location.search).has("ui-test");
  return localUiTest || Boolean(state.cloud.user && (state.cloud.accessToken || state.cloud.refreshToken));
}

function normalizeEmail(email) {
  return String(email || "").trim();
}

function getSavedEmail() {
  try {
    for (const key of EMAIL_STORAGE_KEYS) {
      const email = normalizeEmail(localStorage.getItem(key));
      if (email) return email;
    }
    const saved = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY));
    return normalizeEmail(saved?.email || saved?.user?.email);
  } catch {
    return "";
  }
}

function rememberEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  state.cloud.email = normalized;
  try {
    EMAIL_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, normalized));
    setLoginEmailInputs(normalized);
  } catch {
    // Email memory is a convenience only; login still works without it.
  }
}

function setLoginEmailInputs(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  [els.authEmailInput, els.cloudEmailInput].forEach((input) => {
    if (!input) return;
    if (document.activeElement === input && normalizeEmail(input.value)) return;
    input.value = normalized;
  });
}

function bindRememberEmailInput(input) {
  if (!input) return;
  const save = () => rememberEmail(input.value);
  input.addEventListener("input", save);
  input.addEventListener("change", save);
  input.addEventListener("blur", save);
}

function resetLogView() {
  state.status = "active";
  state.search = "";
  state.tagFilter = "";
  state.locationFilter = "";
  state.listGroupFilter = "";
  state.selectedIds.clear();
  if (els.searchInput) els.searchInput.value = "";
  if (els.tagFilter) els.tagFilter.value = "";
  if (els.tripLocationFilter) els.tripLocationFilter.value = "";
}

function focusLogViewOnSelectedTag() {
  state.listGroupFilter = state.selectedGroupId;
  state.tagFilter = tagFilterValue(state.selectedGroupId, state.selectedTagId);
  state.search = "";
  if (!isTripGroup(state.selectedGroupId)) state.locationFilter = "";
  state.selectedIds.clear();
}

function syncSelectionFromTagFilter() {
  if (!state.tagFilter) return;
  const selected = parseTagFilter(state.tagFilter);
  const group = findGroup(selected.groupId);
  const tag = findTag(group, selected.tagId, { includeInactive: false });
  if (!group || !tag) return;
  state.selectedGroupId = group.id;
  state.selectedTagId = tag.id;
  state.listGroupFilter = group.id;
  if (!isTripGroup(group.id)) state.locationFilter = "";
}

function renderAuthGate() {
  if (!els.authGate) return;
  const signedIn = isCloudSignedIn();
  document.body.classList.toggle("is-authenticated", signedIn);
  els.authGate.hidden = signedIn;
  if (!signedIn) setLoginEmailInputs(state.cloud.email || getSavedEmail());
  if (els.authStatus) {
    if (state.cloud.isSyncing) {
      els.authStatus.textContent = "클라우드에 연결하는 중입니다.";
    } else if (signedIn) {
      els.authStatus.textContent = `${state.cloud.user?.email || "로컬 테스트"} 계정으로 연결되었습니다.`;
    } else {
      els.authStatus.textContent = "이메일과 비밀번호로 로그인하면 PC, 태블릿, 휴대폰에서 같은 로그를 볼 수 있습니다.";
    }
  }
  if (els.authLoginBtn) els.authLoginBtn.disabled = state.cloud.isSyncing;
  if (els.authSignupBtn) els.authSignupBtn.disabled = state.cloud.isSyncing;
}

function renderPickers() {
  els.groupPicker.replaceChildren(
    ...state.groups.map((group) => {
      const tags = orderedTags(group);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = group.name;
      button.classList.toggle("is-active", group.id === state.selectedGroupId);
      button.disabled = tags.length === 0;
      button.addEventListener("click", () => {
        state.selectedGroupId = group.id;
        state.selectedTagId = tags[0]?.id || "";
        if (isTripGroup(group.id) && !state.tripLocations.includes(state.selectedTripLocation)) {
          state.selectedTripLocation = state.tripLocations[0];
        }
        focusLogViewOnSelectedTag();
        render();
      });
      return button;
    }),
  );

  const group = findGroup(state.selectedGroupId);
  els.tagPicker.replaceChildren(
    ...orderedTags(group).map((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = tag.name;
      button.classList.toggle("is-active", tag.id === state.selectedTagId);
      button.addEventListener("click", () => {
        state.selectedTagId = tag.id;
        focusLogViewOnSelectedTag();
        render();
      });
      return button;
    }),
  );

  renderTripLocationPicker();
}

function renderTripLocationPicker() {
  if (!els.tripLocationField || !els.tripLocationPicker) return;
  const showLocations = isTripGroup(state.selectedGroupId);
  els.tripLocationField.hidden = !showLocations;
  if (!showLocations) {
    els.tripLocationPicker.replaceChildren();
    return;
  }
  state.tripLocations = mergeTripLocations(state.tripLocations);
  if (!state.tripLocations.includes(state.selectedTripLocation)) state.selectedTripLocation = state.tripLocations[0];
  els.tripLocationPicker.replaceChildren(
    ...state.tripLocations.map((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = location;
      button.classList.toggle("is-active", location === state.selectedTripLocation);
      button.addEventListener("click", () => {
        state.selectedTripLocation = location;
        renderTripLocationPicker();
      });
      return button;
    }),
  );
}

function renderFilters() {
  renderListGroupPicker();
  const current = state.tagFilter;
  const validValues = state.groups.flatMap((group) =>
    orderedTags(group, { includeInactive: true }).map((tag) => tagFilterValue(group.id, tag.id)),
  );
  els.tagFilter.replaceChildren(option("", "전체 태그"), ...state.groups.map(renderTagGroup));
  els.tagFilter.value = validValues.includes(current) ? current : "";
  state.tagFilter = els.tagFilter.value;
  renderLocationFilter();
  els.searchInput.value = state.search;
  els.sortSelect.value = state.sortMode;
}

function renderLocationFilter() {
  if (!els.tripLocationFilterWrap || !els.tripLocationFilter) return;
  const showLocationFilter = isTripGroup(state.listGroupFilter);
  els.tripLocationFilterWrap.hidden = !showLocationFilter;
  if (!showLocationFilter) {
    state.locationFilter = "";
    els.tripLocationFilter.replaceChildren();
    return;
  }
  state.tripLocations = mergeTripLocations(state.tripLocations);
  const validLocations = new Set(state.tripLocations);
  if (state.locationFilter && !validLocations.has(state.locationFilter)) state.locationFilter = "";
  els.tripLocationFilter.replaceChildren(
    option("", "전체 장소"),
    ...state.tripLocations.map((location) => option(location, location)),
  );
  els.tripLocationFilter.value = state.locationFilter;
}

function renderTagGroup(group) {
  const optgroup = document.createElement("optgroup");
  optgroup.label = group.name;
  optgroup.append(
    ...orderedTags(group, { includeInactive: true }).map((tag) =>
      option(tagFilterValue(group.id, tag.id), tag.isActive === false ? `${tag.name} (비활성)` : tag.name),
    ),
  );
  return optgroup;
}

function tagFilterValue(groupId, tagId) {
  return `${groupId}::${tagId}`;
}

function parseTagFilter(value) {
  const [groupId, ...tagParts] = String(value || "").split("::");
  return { groupId, tagId: tagParts.join("::") };
}

function renderListGroupPicker() {
  const groups = [{ id: "", label: "전체" }, ...state.groups.map((group) => ({ id: group.id, label: group.name }))];
  els.listGroupPicker.replaceChildren(
    ...groups.map((group) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = group.label;
      button.classList.toggle("is-active", group.id === state.listGroupFilter);
      button.addEventListener("click", () => {
        state.listGroupFilter = group.id;
        state.tagFilter = "";
        state.locationFilter = "";
        state.selectedIds.clear();
        renderFilters();
        renderLogs();
        renderBatchBar();
      });
      return button;
    }),
  );
}

function renderCounts() {
  const active = state.logs.filter((log) => !log.deletedAt && !log.completedAt).length;
  const done = state.logs.filter((log) => !log.deletedAt && log.completedAt).length;
  const trash = state.logs.filter((log) => log.deletedAt).length;
  const byGroup = state.groups.map((group) => {
    const count = state.logs.filter((log) => !log.deletedAt && !log.completedAt && log.groupId === group.id).length;
    return `${group.name} ${count}`;
  });
  els.statusCounts.replaceChildren(
    ...[`진행 ${active}`, `완료 ${done}`, `휴지통 ${trash}`, ...byGroup].map((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      return span;
    }),
  );
}

function renderLogs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.status === state.status);
  });

  const visible = getFilteredLogs();
  const trashCount = state.logs.filter((log) => log.deletedAt).length;
  els.emptyTrashBtn.hidden = state.status !== "trash" || trashCount === 0;
  els.selectAllBtn.textContent =
    visible.length > 0 && visible.every((log) => state.selectedIds.has(log.id)) ? "선택해제" : "전체선택";

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      state.status === "trash"
        ? "휴지통이 비어 있습니다."
        : state.status === "done"
          ? "완료된 기록이 없습니다."
          : "진행중 기록이 없습니다.";
    els.logList.replaceChildren(empty);
    renderBatchBar();
    return;
  }

  els.logList.replaceChildren(...visible.map((log) => renderLogCard(log)));
  renderBatchBar();
}

function renderLogCard(log) {
  const groupName = getLogGroupName(log);
  const tagName = getLogTagName(log);
  const card = document.createElement("article");
  card.className = "log-card";
  card.dataset.group = log.groupId;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.selectedIds.has(log.id);
  checkbox.setAttribute("aria-label", "로그 선택");
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) state.selectedIds.add(log.id);
    else state.selectedIds.delete(log.id);
    renderBatchBar();
  });

  const main = document.createElement("div");
  main.className = "log-main";

  const meta = document.createElement("div");
  meta.className = "log-meta";
  meta.append(pill(groupName, groupClass(groupName)), pill(tagName), timeLabel(log.createdAt));
  if (log.location && isTripGroup(log.groupId)) meta.append(pill(log.location));
  if (log.completedAt) meta.append(pill("완료"));
  if (log.deletedAt) meta.append(pill("휴지통"));

  const memo = document.createElement("p");
  memo.className = "memo";
  memo.textContent = log.memo;

  const actions = document.createElement("div");
  actions.className = "log-actions";
  if (log.deletedAt) {
    actions.append(actionButton("복원", () => restoreLogs([log.id]), true));
    actions.append(actionButton("공유", () => shareLogs([log])));
  } else {
    getActionsForLog(log).forEach((action) => actions.append(actionButton(action.label, action.handler, action.important)));
    actions.append(actionButton("이동", () => openMoveModal(log.id)));
    actions.append(actionButton("공유", () => shareLogs([log])));
    actions.append(actionButton("삭제", () => openDeleteModal([log.id]), false, "danger"));
  }

  main.append(meta, memo, actions);

  const lastHistory = log.history?.at(-1);
  if (lastHistory) {
    const history = document.createElement("div");
    history.className = "history-line";
    history.textContent = `${formatDate(lastHistory.at)} · ${lastHistory.note}`;
    main.append(history);
  }

  card.append(checkbox, main);
  return card;
}

function getActionsForLog(log) {
  const groupName = getLogGroupName(log);
  const tagName = getLogTagName(log);
  if (log.completedAt) {
    return [{ label: "진행중으로", important: true, handler: () => {
      const count = reopenLogs([log.id]);
      showToast(`${count}건을 진행중으로 옮겼습니다.`);
    } }];
  }
  if (groupName === "중국") {
    const actions = [{ label: "발주로 등록", important: true, handler: () => prepareTextOrderFromLog(log) }];
    if (tagName === "확인") {
      actions.push({
        label: "문의 완료",
        handler: () => {
          state.logs = state.logs.map((item) =>
            item.id === log.id ? moveLog(item, "중국", "피드백대기", "문의 완료 → 피드백대기") : item,
          );
          persist();
          render();
          showToast("피드백대기로 이동했습니다.");
        },
      });
      return actions;
    }
    if (tagName === "피드백대기") {
      actions.push(
        { label: "완료", handler: () => completeLog(log.id, "피드백 완료") },
        { label: "매장 연락 생성", handler: () => openFeedbackModal(log.id) },
      );
      return actions;
    }
    actions.push({ label: "완료", handler: () => completeLog(log.id, "완료") });
    return actions;
  }
  if (groupName === "중국" && tagName === "확인") {
    return [
      {
        label: "문의 완료",
        important: true,
        handler: () => {
          state.logs = state.logs.map((item) =>
            item.id === log.id ? moveLog(item, "중국", "피드백대기", "문의 완료 → 피드백대기") : item,
          );
          persist();
          render();
          showToast("피드백대기로 이동했습니다.");
        },
      },
    ];
  }
  if (groupName === "중국" && tagName === "피드백대기") {
    return [
      { label: "완료", important: true, handler: () => completeLog(log.id, "피드백 완료") },
      { label: "매장 연락 생성", handler: () => openFeedbackModal(log.id) },
    ];
  }
  if (groupName === "매장" && tagName === "출고") {
    return [{ label: "출고 완료", important: true, handler: () => openShipModal(log.id) }];
  }
  return [{ label: "완료", important: true, handler: () => completeLog(log.id, "완료") }];
}

function renderBatchBar() {
  const count = state.selectedIds.size;
  els.batchBar.hidden = count === 0;
  els.selectedCount.textContent = `${count}건 선택`;
  const inTrash = state.status === "trash";
  const inDone = state.status === "done";
  const selectedLogs = [...state.selectedIds].map(getLogById).filter(Boolean);
  const canBatchShip =
    !inTrash && !inDone && selectedLogs.length > 0 && selectedLogs.every((log) => isActiveStoreShipmentLog(log));
  els.batchTarget.hidden = inTrash || inDone;
  els.applyBatchBtn.hidden = inTrash || inDone;
  if (els.batchShipAction) els.batchShipAction.hidden = !canBatchShip;
  if (els.batchShipBtn) els.batchShipBtn.hidden = !canBatchShip;
  if (els.batchReopenBtn) els.batchReopenBtn.hidden = !inDone;
  els.batchDeleteBtn.hidden = inTrash;
  els.batchRestoreBtn.hidden = !inTrash;
  renderTargetOptions(els.batchTarget);
}

function renderSettings() {
  if (state.module === "settings") beginTagSettingsEdit();
  const settingsGroups = state.tagDraftGroups || state.groups;
  els.settingsGroups.replaceChildren(
    ...settingsGroups.map((group) => {
      const card = document.createElement("section");
      card.className = "settings-card";

      const heading = document.createElement("h3");
      heading.textContent = group.name;

      const editor = document.createElement("div");
      editor.className = "tag-editor";

      const activeTags = orderedTags(group);
      orderedTags(group, { includeInactive: true }).forEach((tag) => {
        const activeIndex = activeTags.findIndex((item) => item.id === tag.id);
        const row = document.createElement("div");
        row.className = "tag-row";
        row.classList.toggle("is-inactive", tag.isActive === false);

        const input = document.createElement("input");
        input.value = tag.name;
        input.setAttribute("aria-label", `${group.name} 태그 이름`);
        input.addEventListener("change", () => renameTag(group.id, tag.id, input.value.trim()));

        if (tag.isActive === false) {
          const inactive = document.createElement("span");
          inactive.className = "inactive-tag-label";
          inactive.textContent = "비활성";
          const restore = smallButton("복원", () => restoreTag(group.id, tag.id), false);
          row.append(input, inactive, restore);
        } else {
          const up = smallButton("↑", () => reorderTag(group.id, tag.id, -1), activeIndex === 0);
          const down = smallButton("↓", () => reorderTag(group.id, tag.id, 1), activeIndex === activeTags.length - 1);
          const save = smallButton("✓", () => renameTag(group.id, tag.id, input.value.trim()), false);
          const remove = smallButton("삭제", () => openTagDeleteModal(group.id, tag.id), false);

          row.append(input, up, down, save, remove);
        }
        editor.append(row);
      });

      const addRow = document.createElement("div");
      addRow.className = "add-tag-row";
      const addInput = document.createElement("input");
      addInput.placeholder = "새 태그";
      addInput.setAttribute("aria-label", `${group.name} 새 태그`);
      const add = smallButton("+", () => {
        addTag(group.id, addInput.value.trim());
        addInput.value = "";
      });
      addRow.append(addInput, add);
      editor.append(addRow);

      card.append(heading, editor);
      return card;
    }),
  );
  if (els.tagSettingsStatus) {
    els.tagSettingsStatus.textContent = state.tagSettingsDirty
      ? "저장하지 않은 변경사항이 있습니다. 설정 저장을 눌러주세요."
      : "태그를 수정한 뒤 설정 저장을 눌러주세요.";
  }
  if (els.saveTagSettingsBtn) els.saveTagSettingsBtn.disabled = !state.tagSettingsDirty;
  if (els.cancelTagSettingsBtn) els.cancelTagSettingsBtn.disabled = !state.tagSettingsDirty;
  renderTripLocationSettings();
}

function beginTagSettingsEdit() {
  if (!state.tagDraftGroups) state.tagDraftGroups = structuredClone(state.groups);
}

function markTagSettingsDirty() {
  state.tagSettingsDirty = true;
  if (els.tagSettingsStatus) els.tagSettingsStatus.textContent = "저장하지 않은 변경사항이 있습니다. 설정 저장을 눌러주세요.";
}

function saveTagSettings() {
  if (!state.tagDraftGroups || !state.tagSettingsDirty) return;
  localStorage.setItem(
    TAG_SETTINGS_BACKUP_KEY,
    JSON.stringify({ backedUpAt: new Date().toISOString(), groups: state.groups, logs: state.logs }),
  );
  state.groups = normalizeStoredGroups(state.tagDraftGroups);
  const moves = [...state.tagPendingMoves];
  state.logs = state.logs.map((log) => {
    const move = moves.find((item) => item.groupId === log.groupId && item.fromTagId === log.tagId);
    return move ? moveLog(log, move.groupId, move.toTagId, "태그 비활성 전 이동") : log;
  });
  state.tagDraftGroups = structuredClone(state.groups);
  state.tagPendingMoves = [];
  state.tagSettingsDirty = false;
  normalizeSelection();
  persist();
  render();
  showToast("태그 설정을 저장했습니다.");
}

function cancelTagSettings() {
  state.tagDraftGroups = structuredClone(state.groups);
  state.tagPendingMoves = [];
  state.tagSettingsDirty = false;
  renderSettings();
  showToast("저장 전 태그 설정으로 되돌렸습니다.");
}

function renderTripLocationSettings() {
  if (!els.tripLocationList) return;
  state.tripLocations = mergeTripLocations(state.tripLocations);
  els.tripLocationList.replaceChildren(
    ...state.tripLocations.map((location, index) => {
      const row = document.createElement("div");
      row.className = "tag-row trip-location-row";
      row.dataset.location = location;
      row.classList.toggle("is-dragging", state.draggingTripLocation === location);

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "drag-handle";
      handle.textContent = "이동";
      handle.setAttribute("aria-label", `${location} 순서 이동`);
      handle.addEventListener("pointerdown", (event) => startTripLocationDrag(event, location));

      const input = document.createElement("input");
      input.value = location;
      input.setAttribute("aria-label", "중국출장 장소 이름");
      input.addEventListener("change", () => renameTripLocation(location, input.value.trim()));

      const actions = document.createElement("div");
      actions.className = "trip-location-actions";
      const up = smallButton("위", () => reorderTripLocation(index, index - 1), index === 0);
      const down = smallButton("아래", () => reorderTripLocation(index, index + 1), index === state.tripLocations.length - 1);
      const save = smallButton("저장", () => renameTripLocation(location, input.value.trim()));
      const remove = smallButton("삭제", () => removeTripLocation(location));
      actions.append(up, down, save, remove);

      row.append(handle, input, actions);
      return row;
    }),
  );
  if (els.newTripLocationInput) els.newTripLocationInput.value = "";
}

function renderCloudSettings() {
  if (!els.cloudStatus) return;
  renderAuthGate();
  renderSyncState();
  els.cloudUrlInput.value = state.cloud.url;
  els.cloudAnonKeyInput.value = state.cloud.anonKey;
  if (document.activeElement !== els.cloudEmailInput) {
    els.cloudEmailInput.value = state.cloud.email || getSavedEmail();
  }
  els.cloudPasswordInput.value = "";

  const parts = [];
  if (!state.cloud.url || !state.cloud.anonKey) {
    parts.push("Supabase 주소와 anon key를 입력하면 클라우드 동기화를 사용할 수 있습니다.");
  } else if (!state.cloud.user || (!state.cloud.accessToken && !state.cloud.refreshToken)) {
    parts.push("클라우드 설정 저장됨. 가입 또는 로그인 후 동기화할 수 있습니다.");
  } else {
    parts.push(`${state.cloud.user.email || "로그인됨"} 계정으로 연결됨.`);
    parts.push("자동 동기화 켜짐.");
  }
  if (state.cloud.lastSyncAt) parts.push(`마지막 동기화: ${formatDate(state.cloud.lastSyncAt)}`);
  if (state.cloud.isSyncing) parts.push("동기화 중...");
  if (!navigator.onLine) parts.push("인터넷 연결 대기 중.");
  if (state.cloud.hasPendingChanges) parts.push("저장 대기 중. 연결되면 자동으로 다시 저장합니다.");
  if (state.cloud.lastErrorMessage) parts.push(`마지막 저장 실패: ${state.cloud.lastErrorMessage}`);
  els.cloudStatus.textContent = parts.join(" ");

  els.cloudSyncBtn.disabled =
    state.cloud.isSyncing || !state.cloud.user || (!state.cloud.accessToken && !state.cloud.refreshToken);
  els.cloudLoginBtn.disabled = state.cloud.isSyncing;
  els.cloudSignupBtn.disabled = state.cloud.isSyncing;
  els.cloudLogoutBtn.disabled = state.cloud.isSyncing || !state.cloud.user;
}

function renderSyncState() {
  if (!els.syncPill) return;
  const status = syncStatusInfo();
  els.syncPill.textContent = status.label;
  els.syncPill.dataset.status = status.status;
  els.syncPill.hidden = false;
}

function syncStatusInfo() {
  if (!navigator.onLine) return { status: "offline", label: "오프라인" };
  if (!state.cloud.enabled || !isCloudSignedIn()) return { status: "signed-out", label: "로그인 필요" };
  if (state.cloud.isSyncing) return { status: "syncing", label: "저장 중" };
  if (state.cloud.lastErrorMessage) return { status: "error", label: "저장 확인" };
  if (state.cloud.hasPendingChanges) return { status: "pending", label: "저장 대기" };
  if (state.cloud.lastSyncAt) return { status: "saved", label: "저장 완료" };
  return { status: "ready", label: "연결됨" };
}

function saveCloudConfigFromForm() {
  state.cloud.url = els.cloudUrlInput.value.trim().replace(/\/$/, "");
  state.cloud.anonKey = els.cloudAnonKeyInput.value.trim();
  state.cloud.email = normalizeEmail(els.cloudEmailInput.value) || state.cloud.email || getSavedEmail();
  rememberEmail(state.cloud.email);
  state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
  saveCloudConfig();
}

function saveCloudConfigFromAuthForm() {
  state.cloud.url = state.cloud.url || DEFAULT_CLOUD_URL;
  state.cloud.anonKey = state.cloud.anonKey || DEFAULT_CLOUD_ANON_KEY;
  state.cloud.email = normalizeEmail(els.authEmailInput.value) || state.cloud.email || getSavedEmail();
  rememberEmail(state.cloud.email);
  state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
  saveCloudConfig();
}

function saveCloudConfigFromSource(source) {
  if (source === "auth") {
    saveCloudConfigFromAuthForm();
    return;
  }
  saveCloudConfigFromForm();
}

function getCloudPassword(source) {
  return source === "auth" ? els.authPasswordInput.value : els.cloudPasswordInput.value;
}

function ensureCloudReady() {
  if (!state.cloud.enabled) throw new Error("Supabase 설정이 필요합니다.");
}

async function initializeCloudSession() {
  if (!state.cloud.enabled) {
    renderCloudSettings();
    return;
  }
  try {
    await ensureCloudAccess();
    renderCloudSettings();
    if (state.cloud.user) {
      if (state.cloud.hasPendingChanges) {
        await pushPendingCloudState({ silent: true, force: true }).catch(() => {});
      }
      if (!state.cloud.hasPendingChanges) await syncCloud({ silent: true });
      startAutoSync();
    }
  } catch {
    stopAutoSync();
    renderCloudSettings();
  }
}

async function cloudSignup(source = "settings") {
  saveCloudConfigFromSource(source);
  const password = getCloudPassword(source);
  if (!state.cloud.email || !password) {
    showToast("이메일과 비밀번호를 입력하세요.");
    return;
  }
  await runCloudTask(async () => {
    const data = await cloudAuthRequest("signup", { email: state.cloud.email, password });
    applyCloudAuth(data);
    if (state.cloud.accessToken) {
      state.module = "logs";
      resetLogView();
      await syncCloud({ silent: true, resetView: true });
      startAutoSync();
      showToast("가입하고 클라우드에 연결했습니다.");
    } else {
      showToast("가입 메일을 확인한 뒤 로그인하세요.");
    }
  });
}

async function cloudLogin(source = "settings") {
  saveCloudConfigFromSource(source);
  const password = getCloudPassword(source);
  if (!state.cloud.email || !password) {
    showToast("이메일과 비밀번호를 입력하세요.");
    return;
  }
  await runCloudTask(async () => {
    const data = await cloudAuthRequest("token?grant_type=password", { email: state.cloud.email, password });
    applyCloudAuth(data);
    state.module = "logs";
    resetLogView();
    await syncCloud({ silent: true, resetView: true });
    startAutoSync();
    showToast("클라우드에 로그인했습니다.");
  });
}

async function cloudLogout() {
  await runCloudTask(async () => {
    if (state.cloud.accessToken) {
      await fetch(`${state.cloud.url}/auth/v1/logout`, {
        method: "POST",
        headers: cloudHeaders({ auth: true }),
      }).catch(() => {});
    }
    state.cloud.user = null;
    state.cloud.accessToken = "";
    state.cloud.refreshToken = "";
    state.cloud.expiresAt = 0;
    stopAutoSync();
    saveCloudConfig();
    showToast("로그아웃했습니다.");
  });
}

async function cloudAuthRequest(path, body) {
  ensureCloudReady();
  const response = await fetch(`${state.cloud.url}/auth/v1/${path}`, {
    method: "POST",
    headers: cloudHeaders(),
    body: JSON.stringify(body),
  });
  return parseCloudResponse(response);
}

function applyCloudAuth(data) {
  state.cloud.user = data.user || null;
  state.cloud.accessToken = data.access_token || state.cloud.accessToken || "";
  state.cloud.refreshToken = data.refresh_token || state.cloud.refreshToken || "";
  state.cloud.expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : state.cloud.expiresAt;
  if (state.cloud.user?.email) rememberEmail(state.cloud.user.email);
  saveCloudConfig();
}

async function ensureCloudAccess() {
  ensureCloudReady();
  if (state.cloud.accessToken && Date.now() < state.cloud.expiresAt - 60000) return state.cloud.accessToken;
  if (!state.cloud.refreshToken) {
    if (state.cloud.accessToken) return state.cloud.accessToken;
    throw new Error("클라우드 로그인이 필요합니다.");
  }
  const data = await cloudAuthRequest("token?grant_type=refresh_token", {
    refresh_token: state.cloud.refreshToken,
  });
  applyCloudAuth(data);
  return state.cloud.accessToken;
}

async function runCloudTask(task) {
  state.cloud.isSyncing = true;
  renderCloudSettings();
  try {
    await task();
  } catch (error) {
    showToast(error.message || "클라우드 작업에 실패했습니다.");
  } finally {
    state.cloud.isSyncing = false;
    renderCloudSettings();
  }
}

function startAutoSync() {
  if (!isCloudSignedIn()) return;
  stopAutoSync();
  state.cloud.autoSyncTimer = setInterval(() => {
    runAutoSync();
  }, AUTO_SYNC_INTERVAL_MS);
}

function stopAutoSync() {
  clearInterval(state.cloud.autoSyncTimer);
  state.cloud.autoSyncTimer = null;
}

function runAutoSync(options = {}) {
  if (!state.cloud.enabled || !isCloudSignedIn() || state.cloud.isSyncing || !navigator.onLine) return;
  if (document.hidden && !options.force) return;
  if (state.cloud.hasPendingChanges) {
    pushPendingCloudState({ silent: true }).catch(() => {});
    return;
  }
  syncCloud({ silent: true }).catch(() => {});
}

function resumeCloudWork(options = {}) {
  renderCloudSettings();
  if (!state.cloud.enabled || !isCloudSignedIn()) return;
  if (state.cloud.hasPendingChanges) {
    scheduleCloudPush(0);
    return;
  }
  runAutoSync(options);
}

function scheduleCloudPush(delay = CLOUD_PUSH_DELAY_MS) {
  if (!state.cloud.enabled || !state.cloud.user) return;
  markCloudChangeQueued();
  clearTimeout(state.cloud.pushTimer);
  state.cloud.pushTimer = setTimeout(() => {
    pushPendingCloudState({ silent: true }).catch(() => {});
  }, delay);
}

function flushCloudPush() {
  if (!state.cloud.enabled || !isCloudSignedIn() || state.cloud.isSyncing) return;
  clearTimeout(state.cloud.pushTimer);
  if (state.cloud.hasPendingChanges) {
    pushPendingCloudState({ silent: true, keepalive: true }).catch(() => {});
  }
}

function markCloudChangeQueued() {
  if (!state.cloud.enabled || !state.cloud.user) return;
  state.cloud.hasPendingChanges = true;
  state.cloud.pendingSince ||= new Date().toISOString();
  state.cloud.lastErrorMessage = "";
  state.cloud.lastErrorAt = null;
  saveCloudConfig();
  renderCloudSettings();
}

function markCloudPushSucceeded() {
  state.cloud.hasPendingChanges = false;
  state.cloud.pendingSince = null;
  state.cloud.lastErrorMessage = "";
  state.cloud.lastErrorAt = null;
  state.cloud.retryDelayMs = CLOUD_RETRY_DELAY_MS;
  clearTimeout(state.cloud.retryTimer);
  state.cloud.retryTimer = null;
  saveCloudConfig();
  renderCloudSettings();
}

function markCloudPushFailed(error) {
  state.cloud.hasPendingChanges = true;
  state.cloud.pendingSince ||= new Date().toISOString();
  state.cloud.lastErrorAt = new Date().toISOString();
  state.cloud.lastErrorMessage = readableCloudError(error);
  saveCloudConfig();
  renderCloudSettings();
  scheduleCloudRetry();
}

function scheduleCloudRetry() {
  if (!state.cloud.enabled || !isCloudSignedIn()) return;
  clearTimeout(state.cloud.retryTimer);
  const delay = state.cloud.retryDelayMs || CLOUD_RETRY_DELAY_MS;
  state.cloud.retryTimer = setTimeout(() => {
    pushPendingCloudState({ silent: true }).catch(() => {});
  }, delay);
  state.cloud.retryDelayMs = Math.min(delay * 2, CLOUD_RETRY_MAX_DELAY_MS);
}

function readableCloudError(error) {
  if (!navigator.onLine) return "인터넷 연결 대기 중";
  const message = String(error?.message || error || "").trim();
  if (!message) return "자동 저장 재시도 중";
  return message.length > 80 ? `${message.slice(0, 80)}...` : message;
}

async function pushPendingCloudState(options = {}) {
  if (!state.cloud.enabled || !isCloudSignedIn()) return;
  if (state.cloud.isSyncing && !options.force) {
    scheduleCloudPush(Math.max(CLOUD_PUSH_DELAY_MS, 1000));
    return;
  }
  if (!navigator.onLine) {
    markCloudPushFailed(new Error("인터넷 연결 대기 중"));
    return;
  }
  clearTimeout(state.cloud.pushTimer);
  state.cloud.isSyncing = true;
  renderCloudSettings();
  try {
    await Promise.all([
      pushCloudState({ silent: true, keepalive: Boolean(options.keepalive) }),
      pushOrderBoardState({ silent: true, keepalive: Boolean(options.keepalive) }),
    ]);
    state.cloud.lastSyncAt = new Date().toISOString();
    markCloudPushSucceeded();
    if (!options.silent) showToast("클라우드에 저장했습니다.");
  } catch (error) {
    markCloudPushFailed(error);
    if (!options.silent) showToast("저장에 실패했습니다. 자동으로 다시 시도합니다.");
    throw error;
  } finally {
    state.cloud.isSyncing = false;
    renderCloudSettings();
  }
}

async function syncCloud(options = {}) {
  if (!state.cloud.enabled || !state.cloud.user) {
    if (!options.silent) showToast("클라우드 로그인 후 동기화할 수 있습니다.");
    return;
  }
  state.cloud.isSyncing = true;
  renderCloudSettings();
  try {
    const [settingsRows, rows] = await Promise.all([
      cloudDataRequest("ops_settings?select=groups,updated_at&limit=1"),
      cloudDataRequest("ops_logs?select=*"),
    ]);
    const settings = settingsRows?.[0];

    const remoteSnapshot = { groups: settings?.groups, logs: (rows || []).map((row) => ({ id: row.id, group: row.group_name, tag: row.tag })) };
    if (hasLegacyTagData(remoteSnapshot) && !localStorage.getItem(TAG_CLOUD_MIGRATION_BACKUP_KEY)) {
      localStorage.setItem(
        TAG_CLOUD_MIGRATION_BACKUP_KEY,
        JSON.stringify({ backedUpAt: new Date().toISOString(), source: remoteSnapshot }),
      );
    }

    state.groups = mergeGroupSets(state.groups, settings?.groups);
    state.tripLocations = mergeTripLocations([...state.tripLocations, ...getTripLocationsFromGroups(state.groups)]);
    state.logs = mergeLogsForSync(state.logs, (rows || []).map(cloudRowToLog));
    if (state.migrationErrors.length) {
      localStorage.setItem(TAG_MIGRATION_ERRORS_KEY, JSON.stringify(state.migrationErrors));
    }
    if (!state.tagSettingsDirty) state.tagDraftGroups = structuredClone(state.groups);
    await syncOrderBoardState();
    state.selectedIds.clear();
    if (options.resetView) resetLogView();
    normalizeSelection();
    persist({ skipCloud: true });
    render();
    await pushCloudState({ silent: true });
    await pushOrderBoardState({ silent: true });
    markCloudPushSucceeded();
    if (options.showDone) showToast("클라우드 동기화가 끝났습니다.");
  } catch (error) {
    if (!options.silent) showToast(error.message || "클라우드 동기화에 실패했습니다.");
  } finally {
    state.cloud.isSyncing = false;
    renderCloudSettings();
  }
}

async function pushCloudState(options = {}) {
  if (!state.cloud.enabled || !state.cloud.user) return;
  const now = new Date().toISOString();
  await cloudDataRequest("ops_settings?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    keepalive: Boolean(options.keepalive),
    body: {
      user_id: state.cloud.user.id,
      groups: decorateGroupsWithTripLocations(state.groups),
      updated_at: now,
    },
  });

  if (state.logs.length) {
    await cloudDataRequest("ops_logs?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      keepalive: Boolean(options.keepalive),
      body: state.logs.map((log) => logToCloudRow(log, state.cloud.user.id)),
    });
  }
  state.cloud.lastSyncAt = now;
  renderCloudSettings();
  if (!options.silent) showToast("클라우드에 저장했습니다.");
}

async function syncOrderBoardState() {
  if (!state.cloud.enabled || !state.cloud.user) return;
  const [settingsRows, productRows, historyRows] = await Promise.all([
    cloudDataRequest("order_image_settings?select=fields,updated_at&limit=1"),
    cloudDataRequest("order_products?select=*"),
    cloudDataRequest("order_history?select=*"),
  ]);
  const settings = settingsRows?.[0];
  if (settings?.fields) state.orderFields = mergeOrderFields(settings.fields);
  state.orderProducts = mergeOrderProducts(state.orderProducts, (productRows || []).map(cloudRowToOrderProduct));
  state.orderHistory = mergeOrderHistory(state.orderHistory, (historyRows || []).map(cloudRowToOrderHistory));
  persistOrderBoard({ skipCloud: true });
}

async function pushOrderBoardState(options = {}) {
  if (!state.cloud.enabled || !state.cloud.user) return;
  const now = new Date().toISOString();
  await cloudDataRequest("order_image_settings?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    keepalive: Boolean(options.keepalive),
    body: {
      user_id: state.cloud.user.id,
      fields: state.orderFields,
      updated_at: now,
    },
  });

  if (state.orderProducts.length) {
    await cloudDataRequest("order_products?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      keepalive: Boolean(options.keepalive),
      body: state.orderProducts.map((product) => orderProductToCloudRow(product, state.cloud.user.id)),
    });
  }

  if (state.orderHistory.length) {
    await cloudDataRequest("order_history?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      keepalive: Boolean(options.keepalive),
      body: state.orderHistory.map((entry) => orderHistoryToCloudRow(entry, state.cloud.user.id)),
    });
  }

  if (!options.silent) showToast("발주 이미지판을 클라우드에 저장했습니다.");
}

async function deleteCloudLogs(ids) {
  if (!ids.length || !state.cloud.enabled || !state.cloud.user) return;
  try {
    await cloudDataRequest(`ops_logs?id=in.(${ids.map((id) => `"${id}"`).join(",")})`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
  } catch {
    // Local deletion is kept even if the network is temporarily unavailable.
  }
}

async function cloudDataRequest(path, options = {}) {
  await ensureCloudAccess();
  const response = await fetch(`${state.cloud.url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: cloudHeaders({ auth: true, prefer: options.prefer }),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    keepalive: Boolean(options.keepalive),
  });
  if (response.status === 401 && state.cloud.refreshToken && !options._retried) {
    state.cloud.accessToken = "";
    await ensureCloudAccess();
    return cloudDataRequest(path, { ...options, _retried: true });
  }
  return parseCloudResponse(response);
}

function cloudHeaders(options = {}) {
  const headers = {
    apikey: state.cloud.anonKey,
    "Content-Type": "application/json",
  };
  if (options.auth && state.cloud.accessToken) headers.Authorization = `Bearer ${state.cloud.accessToken}`;
  if (options.prefer) headers.Prefer = options.prefer;
  return headers;
}

async function parseCloudResponse(response) {
  if (response.ok) {
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  const text = await response.text();
  let message = text || `클라우드 요청 실패 (${response.status})`;
  try {
    const payload = JSON.parse(text);
    message = payload.msg || payload.message || payload.error_description || message;
  } catch {
    // Keep the plain response text.
  }
  throw new Error(message);
}

function mergeGroupSets(localGroups, remoteGroups) {
  const source = Array.isArray(remoteGroups) && remoteGroups.length ? remoteGroups : localGroups;
  return normalizeStoredGroups(source);
}

function mergeLogsForSync(localLogs, remoteLogs) {
  const byId = new Map();
  [...localLogs, ...remoteLogs].forEach((log) => {
    if (!log?.id) return;
    const current = byId.get(log.id);
    if (!current || new Date(log.updatedAt || log.createdAt) >= new Date(current.updatedAt || current.createdAt)) {
      byId.set(log.id, log);
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function historyWithLogLocation(log) {
  const history = Array.isArray(log.history) ? [...log.history] : [];
  if (!log.location) return history;
  const hasLocation = history.some((item) => item?.location === log.location);
  if (hasLocation) return history;
  if (history.length) return [{ ...history[0], location: log.location }, ...history.slice(1)];
  return [{ at: log.createdAt || new Date().toISOString(), note: "장소 저장", location: log.location }];
}

function getLocationFromHistory(history) {
  if (!Array.isArray(history)) return "";
  const item = [...history].reverse().find((entry) => entry?.location);
  return item ? String(item.location || "").trim() : "";
}

function logToCloudRow(log, userId) {
  return {
    id: log.id,
    user_id: userId,
    group_name: log.groupId,
    tag: log.tagId,
    memo: log.memo,
    created_at: log.createdAt,
    updated_at: log.updatedAt || log.createdAt,
    completed_at: log.completedAt || null,
    deleted_at: log.deletedAt || null,
    history: historyWithLogLocation(log),
  };
}

function cloudRowToLog(row) {
  return normalizeLogRecord({
    id: row.id,
    groupId: row.group_name,
    tagId: row.tag,
    group: row.group_name,
    tag: row.tag,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    completedAt: row.completed_at,
    deletedAt: row.deleted_at,
    location: getLocationFromHistory(row.history),
    history: Array.isArray(row.history) ? row.history : [],
  });
}

function mergeOrderProducts(localProducts, remoteProducts) {
  const byId = new Map();
  [...localProducts, ...remoteProducts].forEach((product) => {
    if (!product?.id) return;
    const current = byId.get(product.id);
    const productDate = new Date(product.updatedAt || product.createdAt || 0);
    const currentDate = new Date(current?.updatedAt || current?.createdAt || 0);
    if (!current || productDate >= currentDate) {
      byId.set(product.id, { ...current, ...product, imageData: product.imageData || current?.imageData });
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function mergeOrderHistory(localHistory, remoteHistory) {
  const byId = new Map();
  [...localHistory, ...remoteHistory].map(normalizeOrderHistoryEntry).forEach((entry) => {
    if (!entry?.id) return;
    const current = byId.get(entry.id);
    const entryDate = new Date(entry.createdAt || 0);
    const currentDate = new Date(current?.createdAt || 0);
    if (!current || entryDate >= currentDate) {
      byId.set(entry.id, { ...current, ...entry, pageData: entry.pageData || current?.pageData });
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function orderProductToCloudRow(product, userId) {
  return {
    id: product.id,
    user_id: userId,
    product_number: product.number,
    image_path: product.imagePath,
    fields: product.fields || {},
    created_at: product.createdAt,
    updated_at: product.updatedAt || product.createdAt,
  };
}

function cloudRowToOrderProduct(row) {
  return {
    id: row.id,
    number: row.product_number,
    imagePath: row.image_path,
    fields: row.fields || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function orderHistoryToCloudRow(entry, userId) {
  const normalized = normalizeOrderHistoryEntry(entry);
  const items = Array.isArray(normalized.items) && normalized.items.length ? normalized.items : [{}];
  const storedItems = items.map((item) => ({
    ...item,
    category: normalizeOrderCategory(item.category || normalized.category),
    deliveryStatus: normalizeOrderDeliveryStatus(item.deliveryStatus || normalized.deliveryStatus),
    deliveredAt: item.deliveredAt || normalized.deliveredAt || "",
    status: item.status || normalized.status || "발주완료",
    memo: item.memo || normalized.memo || "",
    sourceLogId: item.sourceLogId || normalized.sourceLogId || "",
  }));
  return {
    id: normalized.id,
    user_id: userId,
    type: normalized.type || "generated",
    memo: normalized.memo || "",
    product_name: normalized.productName || "",
    factory: normalized.factory || "",
    search_text:
      normalized.search ||
      [
        normalized.productName,
        normalized.factory,
        normalized.customer,
        normalized.quantity,
        normalized.category,
        normalized.deliveryStatus,
        normalized.status,
        normalized.dueDate,
        normalized.memo,
      ]
        .filter(Boolean)
        .join(" "),
    items: storedItems,
    image_paths: Array.isArray(normalized.pages) ? normalized.pages : [],
    created_at: normalized.createdAt,
  };
}

function cloudRowToOrderHistory(row) {
  return normalizeOrderHistoryEntry({
    id: row.id,
    type: row.type || "generated",
    memo: row.memo || "",
    productName: row.product_name || "",
    factory: row.factory || "",
    search: row.search_text || "",
    items: Array.isArray(row.items) ? row.items : [],
    pages: Array.isArray(row.image_paths) ? row.image_paths : [],
    createdAt: row.created_at,
  });
}

function addLog(groupRef, tagRef, memo, note = "신규 입력", extra = {}) {
  const group = findGroup(groupRef);
  const tag = findTag(group, tagRef, { includeInactive: false });
  if (!group || !tag) {
    showToast("선택한 그룹 또는 태그를 찾을 수 없습니다.");
    return;
  }
  const now = new Date().toISOString();
  state.logs.unshift({
    id: crypto.randomUUID(),
    groupId: group.id,
    tagId: tag.id,
    location: String(extra.location || "").trim(),
    memo,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    history: [{ at: now, note }],
  });
  persist();
  render();
}

function moveLog(log, groupRef, tagRef, note) {
  const group = findGroup(groupRef);
  const tag = findTag(group, tagRef, { includeInactive: false });
  if (!group || !tag) return log;
  const now = new Date().toISOString();
  const oldGroupName = getLogGroupName(log);
  const oldTagName = getLogTagName(log);
  return {
    ...log,
    groupId: group.id,
    tagId: tag.id,
    location: isTripGroup(group.id) ? log.location || state.selectedTripLocation || state.tripLocations[0] : log.location || "",
    updatedAt: now,
    history: [...(log.history || []), { at: now, note: `${note}: ${oldGroupName} / ${oldTagName} → ${group.name} / ${tag.name}` }],
  };
}

function getLogGroup(log) {
  return findGroup(log?.groupId);
}

function getLogTag(log) {
  return findTag(getLogGroup(log), log?.tagId, { includeInactive: true });
}

function getLogGroupName(log) {
  return getLogGroup(log)?.name || "미확인 그룹";
}

function getLogTagName(log) {
  return getLogTag(log)?.name || "미확인 태그";
}

function completeLog(id, note) {
  const now = new Date().toISOString();
  state.logs = state.logs.map((log) => {
    if (log.id !== id) return log;
    return {
      ...log,
      completedAt: now,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note }],
    };
  });
  state.selectedIds.delete(id);
  persist();
  render();
  showToast("완료목록으로 이동했습니다.");
}

function reopenLogs(ids) {
  const reopenIds = new Set(ids);
  const now = new Date().toISOString();
  let count = 0;
  state.logs = state.logs.map((log) => {
    if (!reopenIds.has(log.id) || !log.completedAt || log.deletedAt) return log;
    count += 1;
    const { completedAt, ...reopened } = log;
    return {
      ...reopened,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note: "완료 취소 → 진행중" }],
    };
  });
  reopenIds.forEach((id) => state.selectedIds.delete(id));
  persist();
  render();
  return count;
}

function openDeleteModal(ids) {
  const targets = ids.map(getLogById).filter(Boolean);
  if (!targets.length) return;

  state.pendingDeleteIds = targets.map((log) => log.id);
  els.deleteSummary.textContent =
    targets.length === 1 ? "이 기록을 휴지통으로 이동할까요?" : `${targets.length}건을 휴지통으로 이동할까요?`;
  els.deletePreview.textContent = formatDeletePreview(targets);
  els.deleteModal.showModal();
}

function moveLogsToTrash(ids) {
  const deleteIds = new Set(ids);
  const now = new Date().toISOString();
  let count = 0;
  state.logs = state.logs.map((log) => {
    if (!deleteIds.has(log.id) || log.deletedAt) return log;
    count += 1;
    return {
      ...log,
      deletedAt: now,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note: "휴지통으로 이동" }],
    };
  });
  deleteIds.forEach((id) => state.selectedIds.delete(id));
  persist();
  render();
  return count;
}

function restoreLogs(ids) {
  const restoreIds = new Set(ids);
  const now = new Date().toISOString();
  let count = 0;
  state.logs = state.logs.map((log) => {
    if (!restoreIds.has(log.id) || !log.deletedAt) return log;
    count += 1;
    const { deletedAt, ...restored } = log;
    return {
      ...restored,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note: "휴지통에서 복원" }],
    };
  });
  restoreIds.forEach((id) => state.selectedIds.delete(id));
  persist();
  render();
  return count;
}

function emptyTrash() {
  const before = state.logs.length;
  const deletedIds = state.logs.filter((log) => log.deletedAt).map((log) => log.id);
  state.logs = state.logs.filter((log) => !log.deletedAt);
  state.selectedIds.clear();
  persist();
  deleteCloudLogs(deletedIds);
  render();
  return before - state.logs.length;
}

function formatDeletePreview(logs) {
  const preview = logs
    .slice(0, 3)
    .map((log) => `[${getLogGroupName(log)} / ${getLogTagName(log)}] ${log.memo}`)
    .join("\n\n");
  return logs.length > 3 ? `${preview}\n\n외 ${logs.length - 3}건` : preview;
}

function handleShipAction(action) {
  els.shipModal.close();
  const count = processStoreShipLogs([els.shipLogId.value], action);
  if (count) showToast(`${STORE_SHIP_ACTION_LABELS[action] || "출고 처리"} 처리했습니다.`);
}

function processStoreShipLogs(ids, action) {
  const idSet = new Set(ids);
  const targets = state.logs.filter((log) => idSet.has(log.id) && isActiveStoreShipmentLog(log));
  if (!targets.length) return 0;

  const now = new Date().toISOString();
  const tasks = getStoreShipTasks(action);
  const sourceIds = new Set(targets.map((log) => log.id));
  const officeLogs = [];

  targets.forEach((source) => {
    tasks.forEach(([groupRef, tagRef]) => {
      const group = findGroup(groupRef);
      const tag = findTag(group, tagRef, { includeInactive: false });
      if (!group || !tag) return;
      officeLogs.push({
        id: crypto.randomUUID(),
        groupId: group.id,
        tagId: tag.id,
        location: "",
        memo: source.memo,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        history: [{ at: now, note: "매장 / 출고에서 자동 생성" }],
      });
    });
  });

  const note = tasks.length ? "출고 후 사무실 업무 생성" : "출고 완료";
  state.logs = state.logs.map((log) => {
    if (!sourceIds.has(log.id)) return log;
    return {
      ...log,
      completedAt: now,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note }],
    };
  });
  state.logs = [...officeLogs, ...state.logs];
  targets.forEach((log) => state.selectedIds.delete(log.id));
  persist();
  render();
  return targets.length;
}

function isActiveStoreShipmentLog(log) {
  return Boolean(
    log && getLogGroupName(log) === "매장" && getLogTagName(log) === "출고" && !log.completedAt && !log.deletedAt,
  );
}

function getStoreShipTasks(action) {
  return (
    {
      statement: [["사무실", "명세서"]],
      "statement-tax": [
        ["사무실", "명세서"],
        ["사무실", "세금계산서"],
      ],
      tax: [["사무실", "세금계산서"]],
      complete: [],
    }[action] || []
  );
}

function openMoveModal(id) {
  const log = getLogById(id);
  if (!log) return;
  els.moveLogId.value = id;
  renderTargetOptions(els.moveTarget);
  els.moveTarget.value = targetValue(log.groupId, log.tagId);
  els.moveModal.showModal();
}

function openShipModal(id) {
  els.shipLogId.value = id;
  els.shipModal.showModal();
}

function openFeedbackModal(id) {
  els.feedbackLogId.value = id;
  els.feedbackMemo.value = "";
  els.feedbackModal.showModal();
}

function renameTag(groupId, tagId, newName) {
  beginTagSettingsEdit();
  const group = findGroup(groupId, state.tagDraftGroups);
  const tag = findTag(group, tagId, { includeInactive: true });
  if (!tag || !newName || newName === tag.name) {
    renderSettings();
    return;
  }
  const duplicate = orderedTags(group, { includeInactive: true }).some(
    (item) => item.id !== tag.id && item.name.toLocaleLowerCase("ko") === newName.toLocaleLowerCase("ko"),
  );
  if (duplicate) {
    showToast("이미 있는 태그입니다.");
    renderSettings();
    return;
  }
  tag.name = newName;
  markTagSettingsDirty();
  renderSettings();
  showToast("이름 변경을 반영했습니다. 설정 저장을 눌러주세요.");
}

function addTag(groupId, name) {
  if (!name) return;
  beginTagSettingsEdit();
  const group = findGroup(groupId, state.tagDraftGroups);
  const duplicate = orderedTags(group, { includeInactive: true }).some(
    (tag) => tag.name.toLocaleLowerCase("ko") === name.toLocaleLowerCase("ko"),
  );
  if (duplicate) {
    showToast("이미 있는 태그입니다.");
    return;
  }
  group.tags.push({
    id: createTagId(),
    name,
    groupId: group.id,
    order: orderedTags(group, { includeInactive: true }).length + 1,
    isActive: true,
  });
  markTagSettingsDirty();
  renderSettings();
  showToast("태그를 추가했습니다. 설정 저장을 눌러주세요.");
}

function openTagDeleteModal(groupId, tagId) {
  beginTagSettingsEdit();
  const group = findGroup(groupId, state.tagDraftGroups);
  const tag = findTag(group, tagId, { includeInactive: true });
  const activeTags = orderedTags(group);
  if (!group || !tag || tag.isActive === false) return;
  if (activeTags.length <= 1) {
    showToast("그룹에는 태그가 최소 1개 필요합니다.");
    return;
  }

  const relatedLogs = state.logs.filter((log) => log.groupId === group.id && log.tagId === tag.id);
  const targetTags = activeTags.filter((item) => item.id !== tag.id);
  state.pendingTagDelete = {
    groupId: group.id,
    groupName: group.name,
    tagId: tag.id,
    tagName: tag.name,
    count: relatedLogs.length,
  };

  els.tagDeleteSummary.textContent =
    relatedLogs.length > 0
      ? `${group.name} / ${tag.name} 태그에 기존 로그 ${relatedLogs.length}건이 있습니다. 기록은 삭제되지 않습니다.`
      : `${group.name} / ${tag.name} 태그를 비활성 처리할까요?`;
  els.tagDeleteMoveArea.hidden = relatedLogs.length === 0 || targetTags.length === 0;
  els.tagDeleteTarget.replaceChildren(...targetTags.map((targetTag) => option(targetTag.id, targetTag.name)));
  els.deleteTagMoveBtn.hidden = relatedLogs.length === 0 || targetTags.length === 0;
  els.deleteTagMoveBtn.disabled = relatedLogs.length > 0 && targetTags.length === 0;
  els.deleteTagKeepBtn.textContent = relatedLogs.length > 0 ? "연결 유지 후 비활성" : "비활성 처리";
  els.tagDeleteNote.textContent =
    relatedLogs.length > 0
      ? "연결을 유지하면 기존 로그에는 이 태그명이 계속 표시되고 새 로그 선택 목록에서만 숨겨집니다. 이동 후 비활성을 선택하면 저장할 때 기존 로그도 선택한 태그로 이동합니다."
      : "비활성 태그는 새 로그 선택 목록에서 숨겨지며 설정에서 다시 복원할 수 있습니다.";
  els.tagDeleteModal.showModal();
}

function deletePendingTag(options = {}) {
  const pending = state.pendingTagDelete;
  if (!pending) return;
  const group = findGroup(pending.groupId, state.tagDraftGroups);
  const tag = findTag(group, pending.tagId, { includeInactive: true });
  if (!group || !tag) {
    els.tagDeleteModal.close();
    state.pendingTagDelete = null;
    return;
  }
  if (orderedTags(group).length <= 1) {
    showToast("그룹에는 태그가 최소 1개 필요합니다.");
    return;
  }

  const targetTagId = els.tagDeleteTarget.value;
  if (options.moveLogs) {
    if (!targetTagId || targetTagId === pending.tagId) {
      showToast("기존 로그를 옮길 태그를 선택하세요.");
      return;
    }
    state.tagPendingMoves = state.tagPendingMoves.filter(
      (move) => !(move.groupId === pending.groupId && move.fromTagId === pending.tagId),
    );
    state.tagPendingMoves.push({ groupId: pending.groupId, fromTagId: pending.tagId, toTagId: targetTagId });
  } else {
    state.tagPendingMoves = state.tagPendingMoves.filter(
      (move) => !(move.groupId === pending.groupId && move.fromTagId === pending.tagId),
    );
  }

  tag.isActive = false;
  state.pendingTagDelete = null;
  markTagSettingsDirty();
  els.tagDeleteModal.close();
  renderSettings();
  showToast(options.moveLogs ? "이동 및 비활성을 준비했습니다. 설정 저장을 눌러주세요." : "비활성을 준비했습니다. 설정 저장을 눌러주세요.");
}

function restoreTag(groupId, tagId) {
  beginTagSettingsEdit();
  const group = findGroup(groupId, state.tagDraftGroups);
  const tag = findTag(group, tagId, { includeInactive: true });
  if (!tag) return;
  const duplicate = orderedTags(group).some(
    (item) => item.id !== tag.id && item.name.toLocaleLowerCase("ko") === tag.name.toLocaleLowerCase("ko"),
  );
  if (duplicate) {
    showToast("같은 이름의 활성 태그가 있어 복원할 수 없습니다.");
    return;
  }
  tag.isActive = true;
  tag.order = orderedTags(group).length + 1;
  state.tagPendingMoves = state.tagPendingMoves.filter(
    (move) => !(move.groupId === group.id && move.fromTagId === tag.id),
  );
  normalizeTagOrders(group);
  markTagSettingsDirty();
  renderSettings();
  showToast("태그를 복원했습니다. 설정 저장을 눌러주세요.");
}

function reorderTag(groupId, tagId, direction) {
  beginTagSettingsEdit();
  const group = findGroup(groupId, state.tagDraftGroups);
  const tags = orderedTags(group);
  const from = tags.findIndex((tag) => tag.id === tagId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= tags.length) return;
  const currentOrder = tags[from].order;
  tags[from].order = tags[to].order;
  tags[to].order = currentOrder;
  normalizeTagOrders(group);
  markTagSettingsDirty();
  renderSettings();
}

function normalizeTagOrders(group) {
  const active = orderedTags(group);
  const inactive = orderedTags(group, { includeInactive: true }).filter((tag) => tag.isActive === false);
  active.forEach((tag, index) => {
    tag.order = index + 1;
  });
  inactive.forEach((tag, index) => {
    tag.order = active.length + index + 1;
  });
}

function addTripLocationFromInput() {
  const location = els.newTripLocationInput.value.trim();
  if (!location) return;
  if (state.tripLocations.includes(location)) {
    showToast("이미 있는 장소입니다.");
    return;
  }
  state.tripLocations.push(location);
  state.selectedTripLocation = location;
  persist();
  render();
  showToast("장소를 추가했습니다.");
}

function renameTripLocation(oldLocation, newLocation) {
  if (!newLocation || newLocation === oldLocation) {
    renderTripLocationSettings();
    return;
  }
  if (state.tripLocations.includes(newLocation)) {
    showToast("이미 있는 장소입니다.");
    renderTripLocationSettings();
    return;
  }
  state.tripLocations = state.tripLocations.map((location) => (location === oldLocation ? newLocation : location));
  state.logs = state.logs.map((log) => {
    if (log.location !== oldLocation) return log;
    return { ...log, location: newLocation, updatedAt: new Date().toISOString() };
  });
  if (state.selectedTripLocation === oldLocation) state.selectedTripLocation = newLocation;
  if (state.locationFilter === oldLocation) state.locationFilter = newLocation;
  persist();
  render();
  showToast("장소 이름을 수정했습니다.");
}

function removeTripLocation(location) {
  if (state.tripLocations.length <= 1) {
    showToast("장소는 최소 1개가 필요합니다.");
    return;
  }
  state.tripLocations = state.tripLocations.filter((item) => item !== location);
  if (state.selectedTripLocation === location) state.selectedTripLocation = state.tripLocations[0];
  if (state.locationFilter === location) state.locationFilter = "";
  persist();
  render();
  showToast("장소를 삭제했습니다.");
}

function reorderTripLocation(from, to, options = {}) {
  state.tripLocations = mergeTripLocations(state.tripLocations);
  if (from < 0 || to < 0 || from >= state.tripLocations.length || to >= state.tripLocations.length || from === to) {
    return false;
  }
  const [location] = state.tripLocations.splice(from, 1);
  state.tripLocations.splice(to, 0, location);
  if (options.persist === false) {
    renderTripLocationSettings();
    renderTripLocationPicker();
    return true;
  }
  persist();
  render();
  showToast("장소 순서를 바꿨습니다.");
  return true;
}

function reorderTripLocationByTarget(dragLocation, targetLocation) {
  const from = state.tripLocations.indexOf(dragLocation);
  const to = state.tripLocations.indexOf(targetLocation);
  if (reorderTripLocation(from, to, { persist: false })) {
    state.tripLocationDragMoved = true;
  }
}

function startTripLocationDrag(event, location) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  state.draggingTripLocation = location;
  state.tripLocationDragMoved = false;
  document.body.classList.add("is-dragging-trip-location");
  document.addEventListener("pointermove", handleTripLocationDragMove);
  document.addEventListener("pointerup", finishTripLocationDrag, { once: true });
  document.addEventListener("pointercancel", finishTripLocationDrag, { once: true });
  renderTripLocationSettings();
}

function handleTripLocationDragMove(event) {
  if (!state.draggingTripLocation) return;
  event.preventDefault();
  const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest(".trip-location-row");
  const targetLocation = targetRow?.dataset.location;
  if (!targetLocation || targetLocation === state.draggingTripLocation) return;
  reorderTripLocationByTarget(state.draggingTripLocation, targetLocation);
}

function finishTripLocationDrag() {
  document.removeEventListener("pointermove", handleTripLocationDragMove);
  document.body.classList.remove("is-dragging-trip-location");
  const moved = state.tripLocationDragMoved;
  state.draggingTripLocation = "";
  state.tripLocationDragMoved = false;
  if (moved) {
    persist();
    render();
    showToast("장소 순서를 바꿨습니다.");
  } else {
    renderTripLocationSettings();
  }
}

function getFilteredLogs() {
  const query = state.search.toLocaleLowerCase("ko-KR");
  return state.logs
    .filter((log) => {
      if (state.status === "trash" && !log.deletedAt) return false;
      if (state.status !== "trash" && log.deletedAt) return false;
      if (state.status === "active" && log.completedAt) return false;
      if (state.status === "done" && !log.completedAt) return false;
      if (state.listGroupFilter && log.groupId !== state.listGroupFilter) return false;
      if (state.tagFilter) {
        const selected = parseTagFilter(state.tagFilter);
        if (log.groupId !== selected.groupId || log.tagId !== selected.tagId) return false;
      }
      if (state.locationFilter && log.location !== state.locationFilter) return false;
      if (!query) return true;
      return [log.memo, getLogGroupName(log), getLogTagName(log), log.location].some((value) =>
        String(value || "").toLocaleLowerCase("ko-KR").includes(query),
      );
    })
    .sort(compareLogs);
}

function compareLogs(a, b) {
  const textCompare = (left, right) => left.localeCompare(right, "ko-KR", { numeric: true, sensitivity: "base" });
  if (state.sortMode === "created-asc") return new Date(a.createdAt) - new Date(b.createdAt);
  if (state.sortMode === "title-asc") return textCompare(getLogTitle(a), getLogTitle(b));
  if (state.sortMode === "title-desc") return textCompare(getLogTitle(b), getLogTitle(a));
  if (state.sortMode === "group-asc")
    return textCompare(getLogGroupName(a), getLogGroupName(b)) || textCompare(getLogTagName(a), getLogTagName(b));
  if (state.sortMode === "tag-asc")
    return textCompare(getLogTagName(a), getLogTagName(b)) || textCompare(getLogGroupName(a), getLogGroupName(b));
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function getLogTitle(log) {
  return String(log.memo || "").split(/[\/\n]/)[0].trim();
}

function getLogById(id) {
  return state.logs.find((log) => log.id === id);
}

function groupClass(groupName) {
  return {
    매장: "store",
    중국: "china",
    중국출장: "trip",
    사무실: "office",
  }[groupName];
}

function renderTargetOptions(select) {
  const current = select.value;
  const values = state.groups.flatMap((group) => orderedTags(group).map((tag) => targetValue(group.id, tag.id)));
  select.replaceChildren(...state.groups.map(renderTargetGroup));
  select.value = values.includes(current) ? current : values[0];
}

function renderTargetGroup(group) {
  const optgroup = document.createElement("optgroup");
  optgroup.label = group.name;
  optgroup.append(...orderedTags(group).map((tag) => option(targetValue(group.id, tag.id), `${group.name} / ${tag.name}`)));
  return optgroup;
}

function targetValue(groupId, tagId) {
  return `${groupId}::${tagId}`;
}

function parseTargetValue(value) {
  const [groupId, ...tagParts] = String(value || "").split("::");
  return { groupId, tagId: tagParts.join("::") };
}

function option(value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  return item;
}

function pill(text, extraClass) {
  const span = document.createElement("span");
  span.className = extraClass ? `pill ${extraClass}` : "pill";
  span.textContent = text;
  return span;
}

function timeLabel(date) {
  const span = document.createElement("span");
  span.className = "time";
  span.textContent = formatDate(date);
  return span;
}

function actionButton(label, handler, important = false, variant = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.classList.toggle("important", important);
  if (variant) button.classList.add(variant);
  button.addEventListener("click", handler);
  return button;
}

function smallButton(label, handler, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", handler);
  return button;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function shareLogs(logs) {
  if (!logs.length) {
    showToast("공유할 기록이 없습니다.");
    return;
  }
  const text = formatShareText(logs);
  openShareModal(text, "업무 로그");
}

function formatShareText(logs) {
  return logs.map((log) => `[${getLogGroupName(log)} / ${getLogTagName(log)}] ${log.memo}`).join("\n\n");
}

function openShareModal(text, title = "업무 로그") {
  state.pendingShareText = text;
  state.pendingShareTitle = title;
  els.sharePreview.textContent = text;
  els.shareModal.showModal();
}

function focusOrderArea(type) {
  const targets = {
    image: els.productSearchInput || els.imageMarkBoard,
    text: els.textOrderMemoInput,
    existing: els.existingOrderImageInput,
  };
  document.querySelectorAll(".order-mode-chip").forEach((button) => button.classList.remove("is-active"));
  const activeButton =
    type === "image" ? els.imageOrderModeBtn : type === "existing" ? els.existingOrderModeBtn : els.textOrderModeBtn;
  activeButton?.classList.add("is-active");
  const target = targets[type];
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (target?.focus) window.setTimeout(() => target.focus(), 250);
}

function prepareTextOrderFromLog(log) {
  state.module = "orderImage";
  render();
  if (els.textOrderMemoInput) els.textOrderMemoInput.value = log.memo;
  if (els.textOrderSourceLogInput) els.textOrderSourceLogInput.value = log.id;
  if (els.textOrderStatusSelect) els.textOrderStatusSelect.value = "발주완료";
  focusOrderArea("text");
  showToast("중국 로그를 텍스트 발주 입력칸으로 옮겼습니다.");
}

function readTextOrderForm() {
  const memo = els.textOrderMemoInput?.value.trim() || "";
  return {
    productName: orderTextTitle(memo),
    factory: "",
    customer: "",
    quantity: "",
    price: "",
    dueDate: "",
    category: normalizeOrderCategory(els.textOrderCategorySelect?.value),
    status: els.textOrderStatusSelect?.value || "발주완료",
    memo,
    sourceLogId: els.textOrderSourceLogInput?.value || "",
  };
}

async function saveTextOrder(options = {}) {
  const values = readTextOrderForm();
  if (!values.memo) {
    showToast("발주 내용을 입력하세요.");
    return;
  }
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 발주 이력을 클라우드에 저장할 수 있습니다.");
    return;
  }

  await runCloudTask(async () => {
    const entry = createTextOrderHistoryEntry(values);
    state.orderHistory.unshift(entry);
    state.orderHistorySearch = "";
    if (values.sourceLogId) markSourceLogAsOrderRegistered(values.sourceLogId, entry.id);
    persistOrderBoard();
    await Promise.all([pushOrderBoardState({ silent: true }), values.sourceLogId ? pushCloudState({ silent: true }) : Promise.resolve()]);
    clearTextOrderForm();
    render();
    showToast("텍스트 발주를 등록했습니다.");
    if (options.share) shareTextOrderEntry(entry);
  });
}

function createTextOrderHistoryEntry(values) {
  const now = new Date().toISOString();
  const item = {
    name: values.productName,
    factory: values.factory,
    customer: values.customer,
    quantity: values.quantity,
    price: values.price,
    dueDate: values.dueDate,
    category: values.category,
    deliveryStatus: DEFAULT_ORDER_DELIVERY_STATUS,
    deliveredAt: "",
    status: values.status,
    memo: values.memo,
    sourceLogId: values.sourceLogId,
  };
  return {
    id: crypto.randomUUID(),
    type: "text",
    createdAt: now,
    productName: values.productName,
    factory: values.factory,
    customer: values.customer,
    quantity: values.quantity,
    price: values.price,
    dueDate: values.dueDate,
    category: values.category,
    deliveryStatus: DEFAULT_ORDER_DELIVERY_STATUS,
    deliveredAt: "",
    status: values.status,
    memo: values.memo,
    search: [values.productName, values.category, DEFAULT_ORDER_DELIVERY_STATUS, values.status, values.memo].filter(Boolean).join(" "),
    sourceLogId: values.sourceLogId,
    pages: [],
    pageData: [],
    items: [item],
  };
}

function markSourceLogAsOrderRegistered(logId, orderId) {
  const now = new Date().toISOString();
  state.logs = state.logs.map((log) =>
    log.id === logId
      ? {
          ...log,
          updatedAt: now,
          completedAt: log.completedAt || now,
          history: [...(log.history || []), { at: now, note: `발주 관리로 등록 (${orderId.slice(0, 8)})` }],
        }
      : log,
  );
  persist({ skipCloud: true });
}

function clearTextOrderForm() {
  [
    els.textOrderMemoInput,
    els.textOrderSourceLogInput,
  ].forEach((input) => {
    if (input) input.value = "";
  });
  if (els.textOrderStatusSelect) els.textOrderStatusSelect.value = "발주완료";
}

function shareTextOrderEntry(entry, options = {}) {
  if (entry?.id && options.markDelivered !== false) {
    updateTextOrderDeliveryStatus(entry.id, "전달완료", { silent: true });
  }
  openShareModal(formatTextOrderShare(entry), "텍스트 발주");
}

function formatTextOrderShare(entry) {
  return entry.memo || getPrimaryOrderItem(entry).memo || entry.productName || "텍스트 발주";
}

function getPrimaryOrderItem(entry) {
  return Array.isArray(entry?.items) ? entry.items[0] || {} : {};
}

function orderTextTitle(text) {
  const firstLine = String(text || "")
    .split(/\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return "텍스트 발주";
  return firstLine.length > 48 ? `${firstLine.slice(0, 47)}...` : firstLine;
}

async function shareToKakao() {
  showToast("공유창에서 카카오톡을 선택하세요.");
  await shareBySystem();
}

function shareToSms() {
  const text = state.pendingShareText;
  if (!text) return;
  const separator = /iPad|iPhone|iPod/i.test(navigator.userAgent) ? "&" : "?";
  window.location.href = `sms:${separator}body=${encodeURIComponent(text)}`;
  els.shareModal.close();
}

async function shareBySystem() {
  const text = state.pendingShareText;
  if (!text) return;
  if (navigator.share) {
    try {
      await navigator.share({ title: state.pendingShareTitle || "업무 로그", text });
      els.shareModal.close();
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  await copyShareText();
}

async function copyShareText() {
  const text = state.pendingShareText;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("공유 내용이 복사되었습니다.");
    els.shareModal.close();
  } catch {
    downloadBlob("ops-share.txt", text, "text/plain;charset=utf-8");
    els.shareModal.close();
  }
}

function renderOrderBoard() {
  ensureOrderElements();
  if (!els.orderImageCounts) return;
  els.orderImageCounts.replaceChildren(
    countPill(`상품 ${state.orderProducts.length}`),
    countPill(`바구니 ${state.orderCart.length}`),
    countPill(`텍스트 ${state.orderHistory.filter((entry) => entry.type === "text").length}`),
    countPill(`이력 ${state.orderHistory.length}`),
  );
  if (els.productSearchInput && document.activeElement !== els.productSearchInput) {
    els.productSearchInput.value = state.orderSearch;
  }
  if (els.orderHistorySearchInput && document.activeElement !== els.orderHistorySearchInput) {
    els.orderHistorySearchInput.value = state.orderHistorySearch;
  }
  renderProductFields();
  renderProductList();
  renderOrderEditor();
  renderOrderCart();
  renderGeneratedOrderPages();
  renderOrderHistory();
}

function renderProductFields() {
  els.productFieldList.replaceChildren(
    ...state.orderFields.map((field, index) => {
      const row = document.createElement("div");
      row.className = "field-row";
      const input = document.createElement("input");
      input.value = field.label;
      input.addEventListener("change", () => {
        field.label = input.value.trim() || field.label;
        persistOrderBoard();
        renderOrderBoard();
      });

      const actions = document.createElement("div");
      actions.className = "field-row-actions";
      const up = orderSmallButton("↑", () => moveOrderField(index, -1));
      const down = orderSmallButton("↓", () => moveOrderField(index, 1));
      const remove = orderSmallButton("삭제", () => removeOrderField(field.id));
      up.disabled = index === 0;
      down.disabled = index === state.orderFields.length - 1;
      actions.append(up, down, remove);
      row.append(input, actions);
      return row;
    }),
  );
}

function renderProductList() {
  const products = getFilteredOrderProducts();
  if (!products.length) {
    els.productList.replaceChildren(emptyText(state.orderProducts.length ? "검색 결과가 없습니다." : "등록된 상품이 없습니다."));
    return;
  }

  els.productList.replaceChildren(
    ...products.map((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.classList.toggle("is-selected", product.id === state.selectedOrderProductId);

      const image = document.createElement("img");
      image.className = "product-thumb";
      image.alt = productFieldValue(product, "name") || product.number;
      setOrderImageElement(image, product);

      const head = document.createElement("div");
      const number = document.createElement("div");
      number.className = "product-number";
      number.textContent = product.number;
      const title = document.createElement("strong");
      title.textContent = productFieldValue(product, "name") || "상품명 없음";
      const factory = document.createElement("p");
      factory.className = "panel-copy";
      factory.textContent = productFieldValue(product, "factory") || "공장명 없음";
      head.append(number, title, factory);

      const selected = product.id === state.selectedOrderProductId;
      const actions = document.createElement("div");
      actions.className = "product-card-actions";
      actions.append(
        orderActionButton(selected ? "선택됨" : "발주 선택", selected ? "plain-action compact" : "primary-action compact", () =>
          selectOrderProduct(product.id),
        ),
        orderActionButton("삭제", "danger-action compact", () => removeOrderProduct(product.id)),
      );

      const fields = document.createElement("div");
      fields.className = "product-fields";
      state.orderFields.forEach((field) => {
        const label = document.createElement("label");
        const span = document.createElement("span");
        span.textContent = field.label;
        const input = document.createElement("input");
        input.value = product.fields?.[field.id] || "";
        input.addEventListener("change", () => {
          product.fields = { ...(product.fields || {}), [field.id]: input.value.trim() };
          product.updatedAt = new Date().toISOString();
          persistOrderBoard();
          pushOrderBoardState({ silent: true }).catch(() => {});
          renderOrderBoard();
        });
        label.append(span, input);
        fields.append(label);
      });

      const details = document.createElement("details");
      details.className = "product-details";
      const summary = document.createElement("summary");
      summary.textContent = "상품 정보 수정";
      details.append(summary, fields);

      card.append(image, head, actions, details);
      return card;
    }),
  );
}

function renderOrderEditor() {
  const product = selectedOrderProduct();
  els.addToCartBtn.disabled = !product;
  els.clearMarkersBtn.disabled = !product || !state.orderMarkers.length;
  els.emptyBoardHint.hidden = Boolean(product);
  els.orderEditImage.hidden = !product;
  els.markerLayer.replaceChildren();
  if (!product) {
    els.orderEditImage.removeAttribute("src");
    els.orderEditorStatus.textContent = "상품을 선택하면 이미지 위를 터치해서 동그라미를 표시할 수 있습니다.";
    return;
  }

  els.orderEditorStatus.textContent = `${product.number} · ${productFieldValue(product, "name") || "상품"} · 동그라미 ${state.orderMarkers.length}개`;
  setOrderImageElement(els.orderEditImage, product);
  state.orderMarkers.forEach((marker, index) => {
    const button = document.createElement("button");
    button.className = "order-marker";
    button.type = "button";
    button.textContent = index + 1;
    button.style.left = `${marker.x * 100}%`;
    button.style.top = `${marker.y * 100}%`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.orderMarkers.splice(index, 1);
      renderOrderEditor();
    });
    els.markerLayer.append(button);
  });
}

function renderOrderCart() {
  if (!state.orderCart.length) {
    els.orderCartList.replaceChildren(emptyText("발주 바구니가 비어 있습니다."));
    return;
  }
  els.orderCartList.replaceChildren(
    ...state.orderCart.map((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const img = document.createElement("img");
      img.className = "cart-thumb";
      img.alt = item.name || item.number;
      setOrderImageElement(img, item);
      const info = document.createElement("div");
      info.innerHTML = `<strong>${escapeHtml(item.number)} · ${escapeHtml(item.name || "상품")}</strong><p class="panel-copy">${escapeHtml(item.factory || "공장명 없음")} · 동그라미 ${item.markers.length}개</p>`;
      row.append(img, info, orderActionButton("삭제", "danger-action compact", () => removeCartItem(item.id)));
      return row;
    }),
  );
}

function renderGeneratedOrderPages() {
  if (!state.generatedOrderPages.length) {
    els.generatedOrderPages.replaceChildren();
    return;
  }
  els.generatedOrderPages.replaceChildren(
    ...state.generatedOrderPages.map((page, index) => {
      const card = document.createElement("div");
      card.className = "generated-page";
      const img = document.createElement("img");
      img.src = page.dataUrl;
      img.alt = `발주 이미지 ${index + 1}`;
      const actions = document.createElement("div");
      actions.className = "generated-actions";
      actions.append(
        orderActionButton("공유", "primary-action compact", () => shareOrderPage(index)),
        orderActionButton("저장", "plain-action", () => downloadDataUrl(`order-page-${index + 1}-${dateStamp()}.jpg`, page.dataUrl)),
      );
      card.append(img, actions);
      return card;
    }),
  );
}

function renderOrderHistory() {
  if (!state.orderHistory.length) {
    state.selectedOrderHistoryIds.clear();
    els.orderHistoryList.replaceChildren(emptyText("저장된 발주 이력이 없습니다."));
    return;
  }
  const filteredEntries = getFilteredOrderHistory();
  const visibleEntries = filteredEntries.slice(0, 30);
  state.selectedOrderHistoryIds.forEach((id) => {
    if (!visibleEntries.some((entry) => entry.id === id)) state.selectedOrderHistoryIds.delete(id);
  });
  if (!visibleEntries.length) {
    state.selectedOrderHistoryIds.clear();
    els.orderHistoryList.replaceChildren(emptyText("발주 검색 결과가 없습니다."));
    return;
  }
  els.orderHistoryList.replaceChildren(
    renderOrderHistoryBatchBar(visibleEntries),
    ...visibleEntries.map((entry) => {
      const row = document.createElement("div");
      row.className = "history-row";
      row.dataset.type = entry.type || "";
      row.classList.toggle("is-selected", state.selectedOrderHistoryIds.has(entry.id));

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.selectedOrderHistoryIds.has(entry.id);
      checkbox.setAttribute("aria-label", "발주 이력 선택");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) state.selectedOrderHistoryIds.add(entry.id);
        else state.selectedOrderHistoryIds.delete(entry.id);
        renderOrderHistory();
      });

      const thumb = createOrderHistoryThumb(entry);
      if (thumb) row.classList.add("has-thumb");
      const info = document.createElement("div");
      info.className = "history-info";

      const titleLine = document.createElement("div");
      titleLine.className = "history-title-line";
      const title = document.createElement("strong");
      title.textContent = orderHistoryTitle(entry);
      titleLine.append(title, createOrderCategoryBadge(entry), createOrderDeliveryBadge(entry), createOrderTypeBadge(entry));

      const meta = document.createElement("p");
      meta.className = "panel-copy";
      meta.textContent = orderHistoryMeta(entry);
      info.append(titleLine, meta);

      const actions = document.createElement("div");
      actions.className = "history-actions";
      if (entry.type === "text") actions.append(createOrderDeliverySelect(entry));
      actions.append(
        createOrderCategorySelect(entry),
        createOrderStatusSelect(entry),
        orderActionButton("공유", "plain-action", () => shareHistoryEntry(entry.id)),
      );

      row.append(checkbox);
      if (thumb) row.append(thumb);
      row.append(info, actions);
      return row;
    }),
  );
}

function getFilteredOrderHistory() {
  const tokens = state.orderHistorySearch
    .trim()
    .toLocaleLowerCase("ko-KR")
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return state.orderHistory;
  return state.orderHistory.filter((entry) => {
    const haystack = orderHistorySearchText(entry).toLocaleLowerCase("ko-KR");
    return tokens.every((token) => haystack.includes(token));
  });
}

function orderHistorySearchText(entry) {
  const items = Array.isArray(entry.items) ? entry.items : [];
  const itemText = items
    .map((item) =>
      [
        item.number,
        item.name,
        item.factory,
        item.customer,
        item.quantity,
        item.price,
        item.dueDate,
        item.status,
        item.category,
        item.deliveryStatus,
        item.deliveredAt,
        item.memo,
        ...(item.fields ? Object.values(item.fields) : []),
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ");
  return [
    entry.type === "text" ? "텍스트 발주" : entry.type === "external" ? "기존 이미지" : "이미지 발주",
    entry.productName,
    entry.factory,
    entry.customer,
    entry.quantity,
    entry.price,
    entry.dueDate,
    entry.status,
    entry.category,
    entry.deliveryStatus,
    entry.deliveredAt,
    entry.search,
    entry.memo,
    itemText,
  ]
    .filter(Boolean)
    .join(" ");
}

function renderOrderHistoryBatchBar(entries) {
  const selectedCount = state.selectedOrderHistoryIds.size;
  const bar = document.createElement("div");
  bar.className = "order-history-batch";

  const summary = document.createElement("strong");
  summary.textContent = `${selectedCount}건 선택`;

  const selectAll = orderActionButton(selectedCount ? "선택해제" : "전체선택", "plain-action", () => {
    if (state.selectedOrderHistoryIds.size) state.selectedOrderHistoryIds.clear();
    else entries.forEach((entry) => state.selectedOrderHistoryIds.add(entry.id));
    renderOrderHistory();
  });

  const statusSelect = document.createElement("select");
  statusSelect.setAttribute("aria-label", "일괄 변경 상태");
  ORDER_STATUS_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusSelect.append(option);
  });
  statusSelect.value = "선적완료";
  statusSelect.disabled = selectedCount === 0;

  const apply = orderActionButton("일괄 상태 변경", "primary-action compact", () => {
    updateOrderHistoryStatus([...state.selectedOrderHistoryIds], statusSelect.value, { clearSelection: true });
  });
  apply.disabled = selectedCount === 0;

  const categorySelect = document.createElement("select");
  categorySelect.setAttribute("aria-label", "일괄 변경 발주 구분");
  ORDER_CATEGORY_OPTIONS.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
  categorySelect.value = DEFAULT_ORDER_CATEGORY;
  categorySelect.disabled = selectedCount === 0;

  const applyCategory = orderActionButton("일괄 구분 변경", "primary-action compact", () => {
    updateOrderHistoryCategory([...state.selectedOrderHistoryIds], categorySelect.value, { clearSelection: true });
  });
  applyCategory.disabled = selectedCount === 0;

  bar.append(summary, selectAll, categorySelect, applyCategory, statusSelect, apply);
  return bar;
}

function createOrderStatusSelect(entry) {
  const select = document.createElement("select");
  select.className = "history-status-select";
  select.setAttribute("aria-label", "발주 진행상황");
  ORDER_STATUS_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.append(option);
  });
  select.value = entry.status || getPrimaryOrderItem(entry).status || "발주완료";
  select.addEventListener("change", () => {
    updateOrderHistoryStatus([entry.id], select.value);
  });
  return select;
}

function createOrderCategorySelect(entry) {
  const select = document.createElement("select");
  select.className = "history-category-select";
  select.setAttribute("aria-label", "발주 구분");
  ORDER_CATEGORY_OPTIONS.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });
  select.value = normalizeOrderCategory(entry.category);
  select.addEventListener("change", () => {
    updateOrderHistoryCategory([entry.id], select.value);
  });
  return select;
}

function updateOrderHistoryStatus(entryIds, status, options = {}) {
  const ids = new Set(entryIds);
  if (!ids.size || !ORDER_STATUS_OPTIONS.includes(status)) return;
  const now = new Date().toISOString();
  let changed = 0;
  state.orderHistory = state.orderHistory.map((entry) => {
    if (!ids.has(entry.id)) return entry;
    changed += 1;
    const items = Array.isArray(entry.items) && entry.items.length ? entry.items : [{}];
    return {
      ...entry,
      status,
      updatedAt: now,
      items: items.map((item) => ({ ...item, status })),
    };
  });
  if (!changed) return;
  if (options.clearSelection) state.selectedOrderHistoryIds.clear();
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  showToast(`${changed}건을 ${status}(으)로 변경했습니다.`);
}

function updateOrderHistoryCategory(entryIds, category, options = {}) {
  const normalizedCategory = normalizeOrderCategory(category);
  const ids = new Set(entryIds);
  if (!ids.size) return;
  const now = new Date().toISOString();
  let changed = 0;
  state.orderHistory = state.orderHistory.map((entry) => {
    if (!ids.has(entry.id)) return entry;
    changed += 1;
    const items = Array.isArray(entry.items) && entry.items.length ? entry.items : [{}];
    return {
      ...entry,
      category: normalizedCategory,
      updatedAt: now,
      items: items.map((item) => ({ ...item, category: normalizedCategory })),
    };
  });
  if (!changed) return;
  if (options.clearSelection) state.selectedOrderHistoryIds.clear();
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  showToast(`${changed}건을 ${normalizedCategory}(으)로 변경했습니다.`);
}

function createOrderDeliverySelect(entry) {
  const select = document.createElement("select");
  select.className = "history-delivery-select";
  select.setAttribute("aria-label", "텍스트 발주 전달여부");
  ORDER_DELIVERY_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.append(option);
  });
  select.value = normalizeOrderDeliveryStatus(entry.deliveryStatus);
  select.addEventListener("change", () => {
    updateTextOrderDeliveryStatus(entry.id, select.value);
  });
  return select;
}

function updateTextOrderDeliveryStatus(entryId, status, options = {}) {
  const normalizedStatus = normalizeOrderDeliveryStatus(status);
  const now = new Date().toISOString();
  let changed = false;
  state.orderHistory = state.orderHistory.map((entry) => {
    if (entry.id !== entryId || entry.type !== "text") return entry;
    changed = true;
    const deliveredAt = normalizedStatus === "전달완료" ? entry.deliveredAt || now : "";
    const items = Array.isArray(entry.items) && entry.items.length ? entry.items : [{}];
    return {
      ...entry,
      deliveryStatus: normalizedStatus,
      deliveredAt,
      updatedAt: now,
      items: items.map((item) => ({ ...item, deliveryStatus: normalizedStatus, deliveredAt })),
    };
  });
  if (!changed) return;
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  if (!options.silent) showToast(`텍스트 발주를 ${normalizedStatus}(으)로 표시했습니다.`);
}

function createOrderHistoryThumb(entry) {
  if (entry.type === "text") return null;
  if (entry.pages?.[0]) {
    const img = document.createElement("img");
    img.className = "history-thumb";
    img.alt = entry.memo || "발주 이력";
    setOrderImageElement(img, { imagePath: entry.pages[0], imageData: entry.pageData?.[0] });
    return img;
  }
  const badge = document.createElement("div");
  badge.className = "history-thumb history-thumb-badge";
  badge.textContent = entry.type === "text" ? "TEXT" : "IMG";
  return badge;
}

function createOrderTypeBadge(entry) {
  const badge = document.createElement("span");
  badge.className = "history-type-badge";
  badge.textContent = entry.type === "text" ? "텍스트" : entry.type === "external" ? "기존 이미지" : "이미지";
  return badge;
}

function createOrderCategoryBadge(entry) {
  const badge = document.createElement("span");
  badge.className = "history-category-badge";
  badge.textContent = normalizeOrderCategory(entry.category);
  return badge;
}

function createOrderDeliveryBadge(entry) {
  if (entry.type !== "text") return document.createDocumentFragment();
  const status = normalizeOrderDeliveryStatus(entry.deliveryStatus);
  const badge = document.createElement("span");
  badge.className = "history-delivery-badge";
  badge.dataset.status = status;
  badge.textContent = status;
  return badge;
}

function orderHistoryTitle(entry) {
  if (entry.type === "text") return entry.productName || entry.memo || "텍스트 발주";
  const names = entry.items?.map((item) => item.name || item.number).filter(Boolean).slice(0, 3).join(", ");
  return names || entry.productName || "기존 발주 이미지";
}

function orderHistoryMeta(entry) {
  const item = getPrimaryOrderItem(entry);
  const dueDate = entry.dueDate || item.dueDate;
  return [
    formatDate(entry.createdAt),
    entry.type === "text" ? normalizeOrderDeliveryStatus(entry.deliveryStatus) : "",
    entry.status || item.status,
    entry.factory || item.factory,
    entry.customer || item.customer,
    entry.quantity || item.quantity,
    dueDate ? `납기 ${dueDate}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

async function handleProductImageUpload(event) {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length) return;
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 이미지를 클라우드에 저장할 수 있습니다.");
    return;
  }
  await runCloudTask(async () => {
    for (const file of files) {
      const image = await compressImageFile(file);
      const imagePath = await uploadOrderImageBlob(image.blob, "products");
      const product = {
        id: crypto.randomUUID(),
        number: nextProductNumber(),
        imagePath,
        imageData: image.dataUrl,
        fields: bulkFieldValues(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.orderProducts.unshift(product);
    }
    persistOrderBoard();
    await pushOrderBoardState({ silent: true });
    renderOrderBoard();
    showToast(`${files.length}개 상품 이미지를 등록했습니다.`);
  });
}

function applyBulkToProducts() {
  const values = bulkFieldValues();
  const entries = Object.entries(values).filter(([, value]) => value);
  if (!entries.length) {
    showToast("전체 적용할 내용을 입력하세요.");
    return;
  }
  const targets = getFilteredOrderProducts();
  targets.forEach((product) => {
    product.fields = { ...(product.fields || {}) };
    entries.forEach(([key, value]) => {
      product.fields[key] = value;
    });
    product.updatedAt = new Date().toISOString();
  });
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  showToast(`${targets.length}개 상품에 전체 적용했습니다.`);
}

function clearBulkInputs() {
  [els.bulkProductName, els.bulkFactory, els.bulkPrice, els.bulkMoq, els.bulkSearch, els.bulkMemo].forEach((input) => {
    input.value = "";
  });
}

function bulkFieldValues() {
  return {
    name: els.bulkProductName.value.trim(),
    factory: els.bulkFactory.value.trim(),
    price: els.bulkPrice.value.trim(),
    moq: els.bulkMoq.value.trim(),
    alias: els.bulkSearch.value.trim(),
    memo: els.bulkMemo.value.trim(),
  };
}

function addProductField() {
  const label = els.newFieldNameInput.value.trim();
  if (!label) return;
  state.orderFields.push({ id: `custom_${Date.now()}`, label });
  els.newFieldNameInput.value = "";
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function moveOrderField(index, direction) {
  const next = index + direction;
  if (next < 0 || next >= state.orderFields.length) return;
  const [field] = state.orderFields.splice(index, 1);
  state.orderFields.splice(next, 0, field);
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function removeOrderField(fieldId) {
  if (!confirm("이 항목을 삭제할까요? 기존 상품의 값은 숨겨집니다.")) return;
  state.orderFields = state.orderFields.filter((field) => field.id !== fieldId);
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function getFilteredOrderProducts() {
  const keyword = state.orderSearch.trim().toLowerCase();
  if (!keyword) return state.orderProducts;
  return state.orderProducts.filter((product) => {
    const haystack = [product.number, ...Object.values(product.fields || {})].join(" ").toLowerCase();
    return haystack.includes(keyword);
  });
}

function selectOrderProduct(productId) {
  state.selectedOrderProductId = productId;
  state.orderMarkers = [];
  renderOrderBoard();
  const product = selectedOrderProduct();
  showToast(`${product?.number || "상품"}을 선택했습니다. 이미지 위에 동그라미를 표시하세요.`);
  requestAnimationFrame(() => {
    els.imageMarkBoard?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function selectedOrderProduct() {
  return state.orderProducts.find((product) => product.id === state.selectedOrderProductId);
}

function addOrderMarker(event) {
  const product = selectedOrderProduct();
  if (!product) return;
  if (event.target.closest(".order-marker")) return;
  const rect = els.imageMarkBoard.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  state.orderMarkers.push({ x, y });
  renderOrderEditor();
}

function addSelectedProductToCart() {
  const product = selectedOrderProduct();
  if (!product) return;
  state.orderCart.push({
    id: crypto.randomUUID(),
    productId: product.id,
    number: product.number,
    name: productFieldValue(product, "name"),
    factory: productFieldValue(product, "factory"),
    imagePath: product.imagePath,
    imageData: product.imageData,
    fields: { ...(product.fields || {}) },
    markers: structuredClone(state.orderMarkers),
    createdAt: new Date().toISOString(),
  });
  state.orderMarkers = [];
  persistOrderBoard();
  renderOrderBoard();
  showToast("발주 바구니에 담았습니다.");
}

function removeCartItem(itemId) {
  state.orderCart = state.orderCart.filter((item) => item.id !== itemId);
  persistOrderBoard();
  renderOrderBoard();
}

function clearOrderCart() {
  state.orderCart = [];
  state.generatedOrderPages = [];
  persistOrderBoard();
  renderOrderBoard();
}

async function generateOrderImages() {
  if (!state.orderCart.length) {
    showToast("발주 바구니가 비어 있습니다.");
    return;
  }
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 발주 이미지를 클라우드에 저장할 수 있습니다.");
    return;
  }
  await runCloudTask(async () => {
    const gridSize = Number(els.orderGridSize.value || 9);
    const dataPages = await buildOrderPageImages(state.orderCart, gridSize);
    const uploadedPages = [];
    for (const page of dataPages) {
      const blob = dataUrlToBlob(page.dataUrl);
      uploadedPages.push(await uploadOrderImageBlob(blob, "orders"));
    }
    state.generatedOrderPages = dataPages;
    state.orderHistorySearch = "";
    const history = {
      id: crypto.randomUUID(),
      type: "generated",
      createdAt: new Date().toISOString(),
      category: normalizeOrderCategory(els.generatedOrderCategorySelect?.value),
      status: "발주완료",
      items: state.orderCart.map((item) => ({
        number: item.number,
        name: item.name,
        factory: item.factory,
        markers: item.markers,
        category: normalizeOrderCategory(els.generatedOrderCategorySelect?.value),
        status: "발주완료",
      })),
      pages: uploadedPages,
      pageData: dataPages.map((page) => page.dataUrl),
      memo: "발주 이미지판 생성",
    };
    state.orderHistory.unshift(history);
    persistOrderBoard();
    await pushOrderBoardState({ silent: true });
    renderOrderBoard();
    showToast(`${dataPages.length}장 발주 이미지를 생성했습니다.`);
  });
}

async function saveExistingOrderImages() {
  const files = [...(els.existingOrderImageInput.files || [])];
  if (!files.length) {
    showToast("기존 발주 이미지를 선택하세요.");
    return;
  }
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 이미지를 클라우드에 저장할 수 있습니다.");
    return;
  }
  await runCloudTask(async () => {
    const pages = [];
    const pageData = [];
    for (const file of files) {
      const image = await compressImageFile(file);
      pages.push(await uploadOrderImageBlob(image.blob, "external-orders"));
      pageData.push(image.dataUrl);
    }
    state.orderHistory.unshift({
      id: crypto.randomUUID(),
      type: "external",
      createdAt: new Date().toISOString(),
      category: normalizeOrderCategory(els.existingOrderCategorySelect?.value),
      status: "발주완료",
      productName: els.existingOrderProductInput.value.trim(),
      factory: els.existingOrderFactoryInput.value.trim(),
      search: els.existingOrderSearchInput.value.trim(),
      memo: els.existingOrderMemoInput.value.trim(),
      pages,
      pageData,
      items: [{ category: normalizeOrderCategory(els.existingOrderCategorySelect?.value), status: "발주완료" }],
    });
    state.orderHistorySearch = "";
    els.existingOrderImageInput.value = "";
    [els.existingOrderProductInput, els.existingOrderFactoryInput, els.existingOrderSearchInput, els.existingOrderMemoInput].forEach(
      (input) => {
        input.value = "";
      },
    );
    persistOrderBoard();
    await pushOrderBoardState({ silent: true });
    renderOrderBoard();
    showToast("기존 발주 이미지를 이력에 저장했습니다.");
  });
}

async function buildOrderPageImages(items, gridSize) {
  const columns = gridSize === 4 ? 2 : 3;
  const rows = gridSize === 6 ? 2 : gridSize === 4 ? 2 : 3;
  const cellWidth = 560;
  const cellHeight = 620;
  const pages = [];
  for (let start = 0; start < items.length; start += gridSize) {
    const chunk = items.slice(start, start + gridSize);
    const canvas = document.createElement("canvas");
    canvas.width = columns * cellWidth;
    canvas.height = rows * cellHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < chunk.length; i += 1) {
      const item = chunk[i];
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = col * cellWidth;
      const y = row * cellHeight;
      await drawOrderCell(ctx, item, x, y, cellWidth, cellHeight);
    }
    pages.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9) });
  }
  return pages;
}

async function drawOrderCell(ctx, item, x, y, width, height) {
  ctx.strokeStyle = "#dce2da";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
  ctx.fillStyle = "#202521";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(item.number || "", x + 24, y + 42);
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(trimCanvasText(ctx, item.name || "상품", width - 48), x + 24, y + 76);
  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#66706a";
  ctx.fillText(trimCanvasText(ctx, item.factory || "", width - 48), x + 24, y + 106);

  const image = await loadOrderImage(item);
  const box = fitImage(image.width, image.height, width - 48, height - 150);
  const imageX = x + 24 + box.x;
  const imageY = y + 126 + box.y;
  ctx.drawImage(image, imageX, imageY, box.width, box.height);

  (item.markers || []).forEach((marker, index) => {
    const cx = imageX + marker.x * box.width;
    const cy = imageY + marker.y * box.height;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#e53935";
    ctx.stroke();
    ctx.fillStyle = "#e53935";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(String(index + 1), cx - 7, cy + 8);
  });
}

function fitImage(imageWidth, imageHeight, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    x: (maxWidth - width) / 2,
    y: (maxHeight - height) / 2,
  };
}

function trimCanvasText(ctx, text, maxWidth) {
  let result = text;
  while (result.length > 1 && ctx.measureText(result).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result === text ? result : `${result.slice(0, -1)}...`;
}

async function shareOrderPage(index) {
  const page = state.generatedOrderPages[index];
  if (!page) return;
  const file = dataUrlToFile(page.dataUrl, `order-page-${index + 1}-${dateStamp()}.jpg`);
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ title: "발주 이미지", text: "발주 이미지입니다.", files: [file] });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  downloadDataUrl(file.name, page.dataUrl);
}

async function shareHistoryEntry(entryId) {
  const entry = state.orderHistory.find((item) => item.id === entryId);
  if (entry?.type === "text") {
    shareTextOrderEntry(entry);
    return;
  }
  const dataUrl = entry?.pageData?.[0] || (entry?.pages?.[0] ? await getOrderImageDataUrl(entry.pages[0]) : "");
  if (!dataUrl) return;
  const file = dataUrlToFile(dataUrl, `order-history-${dateStamp()}.jpg`);
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ title: "발주 이미지", text: entry.memo || "발주 이미지입니다.", files: [file] });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  downloadDataUrl(file.name, dataUrl);
}

async function compressImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, ORDER_IMAGE_MAX_SIZE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", ORDER_IMAGE_QUALITY));
  return { blob, dataUrl: canvas.toDataURL("image/jpeg", ORDER_IMAGE_QUALITY) };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function loadOrderImage(item) {
  const src = item.imageData || (item.imagePath ? await getOrderImageObjectUrl(item.imagePath) : "");
  return loadImage(src);
}

function setOrderImageElement(img, item) {
  if (item.imageData) {
    img.src = item.imageData;
    return;
  }
  if (!item.imagePath) return;
  getOrderImageObjectUrl(item.imagePath)
    .then((url) => {
      img.src = url;
    })
    .catch(() => {});
}

async function uploadOrderImageBlob(blob, folder) {
  await ensureCloudAccess();
  const path = `${state.cloud.user.id}/${folder}/${crypto.randomUUID()}.jpg`;
  const response = await fetch(`${state.cloud.url}/storage/v1/object/${ORDER_IMAGE_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: state.cloud.anonKey,
      Authorization: `Bearer ${state.cloud.accessToken}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
    },
    body: blob,
  });
  if (!response.ok) throw new Error(await response.text());
  return path;
}

async function getOrderImageObjectUrl(path) {
  if (orderImageUrlCache.has(path)) return orderImageUrlCache.get(path);
  await ensureCloudAccess();
  const response = await fetch(`${state.cloud.url}/storage/v1/object/${ORDER_IMAGE_BUCKET}/${path}`, {
    headers: {
      apikey: state.cloud.anonKey,
      Authorization: `Bearer ${state.cloud.accessToken}`,
    },
  });
  if (!response.ok) throw new Error(await response.text());
  const url = URL.createObjectURL(await response.blob());
  orderImageUrlCache.set(path, url);
  return url;
}

async function getOrderImageDataUrl(path) {
  const objectUrl = await getOrderImageObjectUrl(path);
  const response = await fetch(objectUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function dataUrlToFile(dataUrl, filename) {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

function downloadDataUrl(filename, dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

function productFieldValue(product, fieldId) {
  return product.fields?.[fieldId] || "";
}

function nextProductNumber() {
  const max = state.orderProducts.reduce((highest, product) => {
    const number = Number(String(product.number || "").replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `P${String(max + 1).padStart(4, "0")}`;
}

function removeOrderProduct(productId) {
  if (!confirm("상품을 삭제할까요? 이미 저장된 발주 이력은 유지됩니다.")) return;
  state.orderProducts = state.orderProducts.filter((product) => product.id !== productId);
  state.orderCart = state.orderCart.filter((item) => item.productId !== productId);
  if (state.selectedOrderProductId === productId) {
    state.selectedOrderProductId = "";
    state.orderMarkers = [];
  }
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function removeCartItemByProduct(productId) {
  state.orderCart = state.orderCart.filter((item) => item.productId !== productId);
}

function orderActionButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function orderSmallButton(text, onClick) {
  return orderActionButton(text, "plain-action", onClick);
}

function emptyText(text) {
  const p = document.createElement("p");
  p.className = "panel-copy";
  p.textContent = text;
  return p;
}

function countPill(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function exportJson() {
  const payload = JSON.stringify(
    {
      version: 2,
      tagSchemaVersion: TAG_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      groups: state.groups,
      tripLocations: state.tripLocations,
      logs: state.logs,
    },
    null,
    2,
  );
  downloadBlob(`ops-backup-${dateStamp()}.json`, payload, "application/json;charset=utf-8");
}

function exportCsv() {
  const header = ["id", "group", "tag", "location", "memo", "createdAt", "updatedAt", "completedAt"];
  const rows = state.logs.map((log) =>
    [
      log.id,
      getLogGroupName(log),
      getLogTagName(log),
      log.location || "",
      log.memo,
      log.createdAt,
      log.updatedAt,
      log.completedAt || "",
    ]
      .map(csvCell)
      .join(","),
  );
  downloadBlob(`ops-logs-${dateStamp()}.csv`, [header.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      if (!Array.isArray(payload.groups) || !Array.isArray(payload.logs)) throw new Error("Invalid backup");
      localStorage.setItem(
        TAG_SETTINGS_BACKUP_KEY,
        JSON.stringify({ backedUpAt: new Date().toISOString(), groups: state.groups, logs: state.logs }),
      );
      state.groups = normalizeStoredGroups(payload.groups);
      state.tripLocations = mergeTripLocations(payload.tripLocations || getTripLocationsFromGroups(state.groups));
      state.migrationErrors = [];
      state.logs = normalizeStoredLogs(payload.logs, state.groups, state.migrationErrors);
      state.tagDraftGroups = null;
      state.tagPendingMoves = [];
      state.tagSettingsDirty = false;
      state.selectedIds.clear();
      normalizeSelection();
      persist();
      render();
      showToast("백업을 가져왔습니다.");
    } catch {
      showToast("가져올 수 없는 JSON입니다.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}

async function installApp() {
  if (!state.deferredInstallPrompt) return;
  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  els.installBtn.hidden = true;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!location.protocol.startsWith("http")) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
const STORAGE_KEY = "ndm_ops_platform_v1";
const CLOUD_CONFIG_KEY = "ndm_ops_cloud_v1";
const LAST_EMAIL_KEY = "ndm_ops_last_email_v1";
const EMAIL_STORAGE_KEYS = [LAST_EMAIL_KEY, "ndm_ops_login_email_v1"];
const ORDER_BOARD_KEY = "ndm_order_image_board_v1";
const DEFAULT_CLOUD_URL = "https://qslckhefgueflmsxawxz.supabase.co";
const DEFAULT_CLOUD_ANON_KEY = "sb_publishable_CATcL7oVdh4cmJhOxMISFA_Bm65K5ki";
const AUTO_SYNC_INTERVAL_MS = 45000;
const CLOUD_PUSH_DELAY_MS = 350;
const CLOUD_RETRY_DELAY_MS = 8000;
const CLOUD_RETRY_MAX_DELAY_MS = 60000;
const ORDER_IMAGE_BUCKET = "order-images";
const ORDER_IMAGE_MAX_SIZE = 1280;
const ORDER_IMAGE_QUALITY = 0.82;
const CHINA_PRE_ORDER_TAGS = ["문의", "가격확인", "재고확인", "거래처확인", "샘플확인", "진행", "발주확정대기", "보류"];
const CHINA_LEGACY_ORDER_TAGS = ["발주대기", "재고진행", "거래처진행", "확인", "피드백대기"];
const ORDER_STATUS_OPTIONS = ["발주완료", "진행", "이번 주 선적", "선적완료", "입고대기", "매장 출고 연결", "완료", "보류"];
const ORDER_CATEGORY_OPTIONS = ["거래처진행", "재고진행"];
const DEFAULT_ORDER_CATEGORY = "거래처진행";
const ORDER_DELIVERY_OPTIONS = ["전달대기", "전달완료"];
const DEFAULT_ORDER_DELIVERY_STATUS = "전달대기";
const STORE_SHIP_ACTION_LABELS = {
  complete: "출고 완료",
  statement: "사무실 / 명세서",
  "statement-tax": "사무실 / 명세서 + 세금계산서",
  tax: "사무실 / 세금계산서",
};

const DEFAULT_ORDER_FIELDS = [
  { id: "name", label: "상품명" },
  { id: "factory", label: "공장명" },
  { id: "price", label: "단가" },
  { id: "moq", label: "MOQ" },
  { id: "leadTime", label: "납기" },
  { id: "memo", label: "메모" },
  { id: "alias", label: "별칭 검색어" },
  { id: "customer", label: "거래처 검색어" },
  { id: "feature", label: "특징 메모" },
];

const DEFAULT_GROUPS = [
  {
    id: "store",
    name: "매장",
    tags: ["출고", "출고대기", "매장체크", "연락", "보류"],
  },
  {
    id: "china",
    name: "중국",
    tags: CHINA_PRE_ORDER_TAGS,
  },
  {
    id: "office",
    name: "사무실",
    tags: ["명세서", "자료정리", "세금계산서"],
  },
  {
    id: "chinaTrip",
    name: "중국출장",
    tags: ["처리", "확인", "체크", "보류"],
  },
];

const TRIP_GROUP_ID = "chinaTrip";
const DEFAULT_TRIP_LOCATIONS = ["이우 시장 1기", "스카프거리", "사무실", "2기"];

const state = {
  groups: structuredClone(DEFAULT_GROUPS),
  tripLocations: [...DEFAULT_TRIP_LOCATIONS],
  logs: [],
  selectedGroup: "매장",
  selectedTag: "출고",
  selectedTripLocation: DEFAULT_TRIP_LOCATIONS[0],
  draggingTripLocation: "",
  tripLocationDragMoved: false,
  module: "logs",
  status: "active",
  search: "",
  tagFilter: "",
  locationFilter: "",
  listGroupFilter: "",
  sortMode: "created-desc",
  selectedIds: new Set(),
  pendingDeleteIds: [],
  pendingTagDelete: null,
  pendingShareText: "",
  deferredInstallPrompt: null,
  orderFields: structuredClone(DEFAULT_ORDER_FIELDS),
  orderProducts: [],
  orderCart: [],
  orderHistory: [],
  selectedOrderHistoryIds: new Set(),
  orderSearch: "",
  orderHistorySearch: "",
  selectedOrderProductId: "",
  orderMarkers: [],
  generatedOrderPages: [],
  pendingShareTitle: "업무 로그",
  cloud: {
    url: "",
    anonKey: "",
    email: "",
    enabled: false,
    user: null,
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
    isSyncing: false,
    lastSyncAt: null,
    pushTimer: null,
    autoSyncTimer: null,
    retryTimer: null,
    retryDelayMs: CLOUD_RETRY_DELAY_MS,
    hasPendingChanges: false,
    pendingSince: null,
    lastErrorAt: null,
    lastErrorMessage: "",
  },
};

const els = {};
const orderImageUrlCache = new Map();

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  loadState();
  loadCloudConfig();
  loadOrderBoard();
  normalizeSelection();
  bindEvents();
  setLoginEmailInputs(state.cloud.email || getSavedEmail());
  render();
  initializeCloudSession();
  registerServiceWorker();
});

function bindElements() {
  Object.assign(els, {
    groupPicker: document.querySelector("#groupPicker"),
    listGroupPicker: document.querySelector("#listGroupPicker"),
    tagPicker: document.querySelector("#tagPicker"),
    tripLocationField: document.querySelector("#tripLocationField"),
    tripLocationPicker: document.querySelector("#tripLocationPicker"),
    logForm: document.querySelector("#logForm"),
    memoInput: document.querySelector("#memoInput"),
    searchInput: document.querySelector("#searchInput"),
    tagFilter: document.querySelector("#tagFilter"),
    tripLocationFilterWrap: document.querySelector("#tripLocationFilterWrap"),
    tripLocationFilter: document.querySelector("#tripLocationFilter"),
    sortSelect: document.querySelector("#sortSelect"),
    logList: document.querySelector("#logList"),
    statusCounts: document.querySelector("#statusCounts"),
    batchBar: document.querySelector("#batchBar"),
    selectedCount: document.querySelector("#selectedCount"),
    batchTarget: document.querySelector("#batchTarget"),
    applyBatchBtn: document.querySelector("#applyBatchBtn"),
    batchShipAction: document.querySelector("#batchShipAction"),
    batchShipBtn: document.querySelector("#batchShipBtn"),
    batchReopenBtn: document.querySelector("#batchReopenBtn"),
    batchDeleteBtn: document.querySelector("#batchDeleteBtn"),
    batchRestoreBtn: document.querySelector("#batchRestoreBtn"),
    clearSelectionBtn: document.querySelector("#clearSelectionBtn"),
    selectAllBtn: document.querySelector("#selectAllBtn"),
    emptyTrashBtn: document.querySelector("#emptyTrashBtn"),
    settingsGroups: document.querySelector("#settingsGroups"),
    tripLocationList: document.querySelector("#tripLocationList"),
    newTripLocationInput: document.querySelector("#newTripLocationInput"),
    addTripLocationBtn: document.querySelector("#addTripLocationBtn"),
    authGate: document.querySelector("#authGate"),
    authStatus: document.querySelector("#authStatus"),
    authForm: document.querySelector("#authForm"),
    authEmailInput: document.querySelector("#authEmailInput"),
    authPasswordInput: document.querySelector("#authPasswordInput"),
    authLoginBtn: document.querySelector("#authLoginBtn"),
    authSignupBtn: document.querySelector("#authSignupBtn"),
    syncPill: document.querySelector("#syncPill"),
    cloudStatus: document.querySelector("#cloudStatus"),
    cloudUrlInput: document.querySelector("#cloudUrlInput"),
    cloudAnonKeyInput: document.querySelector("#cloudAnonKeyInput"),
    cloudEmailInput: document.querySelector("#cloudEmailInput"),
    cloudPasswordInput: document.querySelector("#cloudPasswordInput"),
    saveCloudConfigBtn: document.querySelector("#saveCloudConfigBtn"),
    cloudSignupBtn: document.querySelector("#cloudSignupBtn"),
    cloudLoginBtn: document.querySelector("#cloudLoginBtn"),
    cloudSyncBtn: document.querySelector("#cloudSyncBtn"),
    cloudLogoutBtn: document.querySelector("#cloudLogoutBtn"),
    exportJsonBtn: document.querySelector("#exportJsonBtn"),
    exportCsvBtn: document.querySelector("#exportCsvBtn"),
    importJsonInput: document.querySelector("#importJsonInput"),
    shareVisibleBtn: document.querySelector("#shareVisibleBtn"),
    shareModal: document.querySelector("#shareModal"),
    sharePreview: document.querySelector("#sharePreview"),
    shareKakaoBtn: document.querySelector("#shareKakaoBtn"),
    shareSmsBtn: document.querySelector("#shareSmsBtn"),
    shareNativeBtn: document.querySelector("#shareNativeBtn"),
    copyShareBtn: document.querySelector("#copyShareBtn"),
    installBtn: document.querySelector("#installBtn"),
    toast: document.querySelector("#toast"),
    moveModal: document.querySelector("#moveModal"),
    moveLogId: document.querySelector("#moveLogId"),
    moveTarget: document.querySelector("#moveTarget"),
    saveMoveBtn: document.querySelector("#saveMoveBtn"),
    shipModal: document.querySelector("#shipModal"),
    shipLogId: document.querySelector("#shipLogId"),
    feedbackModal: document.querySelector("#feedbackModal"),
    feedbackLogId: document.querySelector("#feedbackLogId"),
    feedbackMemo: document.querySelector("#feedbackMemo"),
    createStoreContactBtn: document.querySelector("#createStoreContactBtn"),
    deleteModal: document.querySelector("#deleteModal"),
    deleteSummary: document.querySelector("#deleteSummary"),
    deletePreview: document.querySelector("#deletePreview"),
    confirmDeleteBtn: document.querySelector("#confirmDeleteBtn"),
    emptyTrashModal: document.querySelector("#emptyTrashModal"),
    emptyTrashSummary: document.querySelector("#emptyTrashSummary"),
    confirmEmptyTrashBtn: document.querySelector("#confirmEmptyTrashBtn"),
    tagDeleteModal: document.querySelector("#tagDeleteModal"),
    tagDeleteSummary: document.querySelector("#tagDeleteSummary"),
    tagDeleteMoveArea: document.querySelector("#tagDeleteMoveArea"),
    tagDeleteTarget: document.querySelector("#tagDeleteTarget"),
    tagDeleteNote: document.querySelector("#tagDeleteNote"),
    deleteTagKeepBtn: document.querySelector("#deleteTagKeepBtn"),
    deleteTagMoveBtn: document.querySelector("#deleteTagMoveBtn"),
    orderImageCounts: document.querySelector("#orderImageCounts"),
    imageOrderModeBtn: document.querySelector("#imageOrderModeBtn"),
    textOrderModeBtn: document.querySelector("#textOrderModeBtn"),
    existingOrderModeBtn: document.querySelector("#existingOrderModeBtn"),
    textOrderForm: document.querySelector("#textOrderForm"),
    textOrderProductInput: document.querySelector("#textOrderProductInput"),
    textOrderFactoryInput: document.querySelector("#textOrderFactoryInput"),
    textOrderCustomerInput: document.querySelector("#textOrderCustomerInput"),
    textOrderQuantityInput: document.querySelector("#textOrderQuantityInput"),
    textOrderPriceInput: document.querySelector("#textOrderPriceInput"),
    textOrderDueDateInput: document.querySelector("#textOrderDueDateInput"),
    textOrderCategorySelect: document.querySelector("#textOrderCategorySelect"),
    textOrderStatusSelect: document.querySelector("#textOrderStatusSelect"),
    textOrderMemoInput: document.querySelector("#textOrderMemoInput"),
    textOrderSourceLogInput: document.querySelector("#textOrderSourceLogInput"),
    saveShareTextOrderBtn: document.querySelector("#saveShareTextOrderBtn"),
    clearTextOrderBtn: document.querySelector("#clearTextOrderBtn"),
    orderHistorySearchInput: document.querySelector("#orderHistorySearchInput"),
    productImageInput: document.querySelector("#productImageInput"),
    bulkProductName: document.querySelector("#bulkProductName"),
    bulkFactory: document.querySelector("#bulkFactory"),
    bulkPrice: document.querySelector("#bulkPrice"),
    bulkMoq: document.querySelector("#bulkMoq"),
    bulkSearch: document.querySelector("#bulkSearch"),
    bulkMemo: document.querySelector("#bulkMemo"),
    applyBulkToProductsBtn: document.querySelector("#applyBulkToProductsBtn"),
    clearBulkBtn: document.querySelector("#clearBulkBtn"),
    productFieldList: document.querySelector("#productFieldList"),
    newFieldNameInput: document.querySelector("#newFieldNameInput"),
    addProductFieldBtn: document.querySelector("#addProductFieldBtn"),
    productSearchInput: document.querySelector("#productSearchInput"),
    productList: document.querySelector("#productList"),
    orderEditorStatus: document.querySelector("#orderEditorStatus"),
    imageMarkBoard: document.querySelector("#imageMarkBoard"),
    orderEditImage: document.querySelector("#orderEditImage"),
    markerLayer: document.querySelector("#markerLayer"),
    emptyBoardHint: document.querySelector("#emptyBoardHint"),
    addToCartBtn: document.querySelector("#addToCartBtn"),
    clearMarkersBtn: document.querySelector("#clearMarkersBtn"),
    orderCartList: document.querySelector("#orderCartList"),
    orderGridSize: document.querySelector("#orderGridSize"),
    generatedOrderCategorySelect: document.querySelector("#generatedOrderCategorySelect"),
    generateOrderImagesBtn: document.querySelector("#generateOrderImagesBtn"),
    clearCartBtn: document.querySelector("#clearCartBtn"),
    generatedOrderPages: document.querySelector("#generatedOrderPages"),
    existingOrderImageInput: document.querySelector("#existingOrderImageInput"),
    existingOrderCategorySelect: document.querySelector("#existingOrderCategorySelect"),
    existingOrderProductInput: document.querySelector("#existingOrderProductInput"),
    existingOrderFactoryInput: document.querySelector("#existingOrderFactoryInput"),
    existingOrderSearchInput: document.querySelector("#existingOrderSearchInput"),
    existingOrderMemoInput: document.querySelector("#existingOrderMemoInput"),
    saveExistingOrderBtn: document.querySelector("#saveExistingOrderBtn"),
    orderHistoryList: document.querySelector("#orderHistoryList"),
  });
}

function ensureOrderElements() {
  const selectors = {
    orderImageCounts: "#orderImageCounts",
    imageOrderModeBtn: "#imageOrderModeBtn",
    textOrderModeBtn: "#textOrderModeBtn",
    existingOrderModeBtn: "#existingOrderModeBtn",
    textOrderForm: "#textOrderForm",
    textOrderProductInput: "#textOrderProductInput",
    textOrderFactoryInput: "#textOrderFactoryInput",
    textOrderCustomerInput: "#textOrderCustomerInput",
    textOrderQuantityInput: "#textOrderQuantityInput",
    textOrderPriceInput: "#textOrderPriceInput",
    textOrderDueDateInput: "#textOrderDueDateInput",
    textOrderCategorySelect: "#textOrderCategorySelect",
    textOrderStatusSelect: "#textOrderStatusSelect",
    textOrderMemoInput: "#textOrderMemoInput",
    textOrderSourceLogInput: "#textOrderSourceLogInput",
    saveShareTextOrderBtn: "#saveShareTextOrderBtn",
    clearTextOrderBtn: "#clearTextOrderBtn",
    orderHistorySearchInput: "#orderHistorySearchInput",
    productImageInput: "#productImageInput",
    bulkProductName: "#bulkProductName",
    bulkFactory: "#bulkFactory",
    bulkPrice: "#bulkPrice",
    bulkMoq: "#bulkMoq",
    bulkSearch: "#bulkSearch",
    bulkMemo: "#bulkMemo",
    applyBulkToProductsBtn: "#applyBulkToProductsBtn",
    clearBulkBtn: "#clearBulkBtn",
    productFieldList: "#productFieldList",
    newFieldNameInput: "#newFieldNameInput",
    addProductFieldBtn: "#addProductFieldBtn",
    productSearchInput: "#productSearchInput",
    productList: "#productList",
    orderEditorStatus: "#orderEditorStatus",
    imageMarkBoard: "#imageMarkBoard",
    orderEditImage: "#orderEditImage",
    markerLayer: "#markerLayer",
    emptyBoardHint: "#emptyBoardHint",
    addToCartBtn: "#addToCartBtn",
    clearMarkersBtn: "#clearMarkersBtn",
    orderCartList: "#orderCartList",
    orderGridSize: "#orderGridSize",
    generatedOrderCategorySelect: "#generatedOrderCategorySelect",
    generateOrderImagesBtn: "#generateOrderImagesBtn",
    clearCartBtn: "#clearCartBtn",
    generatedOrderPages: "#generatedOrderPages",
    existingOrderImageInput: "#existingOrderImageInput",
    existingOrderCategorySelect: "#existingOrderCategorySelect",
    existingOrderProductInput: "#existingOrderProductInput",
    existingOrderFactoryInput: "#existingOrderFactoryInput",
    existingOrderSearchInput: "#existingOrderSearchInput",
    existingOrderMemoInput: "#existingOrderMemoInput",
    saveExistingOrderBtn: "#saveExistingOrderBtn",
    orderHistoryList: "#orderHistoryList",
  };
  Object.entries(selectors).forEach(([key, selector]) => {
    if (!els[key]) els[key] = document.querySelector(selector);
  });
}

function bindEvents() {
  document.querySelectorAll(".module-tab[data-module]").forEach((button) => {
    button.addEventListener("click", () => {
      state.module = button.dataset.module;
      render();
    });
  });

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      state.selectedIds.clear();
      renderLogs();
      renderBatchBar();
    });
  });

  els.logForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const memo = els.memoInput.value.trim();
    if (!memo) {
      showToast("메모를 입력하세요.");
        return;
    }
    focusLogViewOnSelectedTag();
    addLog(state.selectedGroup, state.selectedTag, memo, "신규 입력", {
      location: isTripGroup(state.selectedGroup) ? state.selectedTripLocation : "",
    });
    els.memoInput.value = "";
    els.memoInput.focus();
    showToast("저장했습니다.");
  });

  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value.trim();
    renderLogs();
  });

  els.tagFilter.addEventListener("change", () => {
    state.tagFilter = els.tagFilter.value;
    syncSelectionFromTagFilter();
    state.selectedIds.clear();
    render();
  });

  els.tripLocationFilter?.addEventListener("change", () => {
    state.locationFilter = els.tripLocationFilter.value;
    state.selectedIds.clear();
    renderLogs();
    renderBatchBar();
  });

  els.sortSelect.addEventListener("change", () => {
    state.sortMode = els.sortSelect.value;
    renderLogs();
  });

  els.selectAllBtn.addEventListener("click", () => {
    const visible = getFilteredLogs();
    const allSelected = visible.length > 0 && visible.every((log) => state.selectedIds.has(log.id));
    if (allSelected) {
      visible.forEach((log) => state.selectedIds.delete(log.id));
    } else {
      visible.forEach((log) => state.selectedIds.add(log.id));
    }
    renderLogs();
    renderBatchBar();
  });

  els.clearSelectionBtn.addEventListener("click", () => {
    state.selectedIds.clear();
    renderLogs();
    renderBatchBar();
  });

  els.applyBatchBtn.addEventListener("click", () => {
    const target = parseTargetValue(els.batchTarget.value);
    const count = state.selectedIds.size;
    if (!count || !target.group || !target.tag) return;
    state.logs = state.logs.map((log) => {
      if (!state.selectedIds.has(log.id)) return log;
      return moveLog(log, target.group, target.tag, "일괄 변경");
    });
    state.selectedIds.clear();
    persist();
    render();
    showToast(`${count}건을 변경했습니다.`);
  });

  els.batchShipBtn?.addEventListener("click", () => {
    const action = els.batchShipAction?.value || "complete";
    const count = processStoreShipLogs([...state.selectedIds], action);
    if (count) showToast(`${count}건을 ${STORE_SHIP_ACTION_LABELS[action] || "출고 처리"}로 처리했습니다.`);
  });

  els.batchReopenBtn?.addEventListener("click", () => {
    const count = reopenLogs([...state.selectedIds]);
    showToast(`${count}건을 진행중으로 옮겼습니다.`);
  });

  els.batchDeleteBtn.addEventListener("click", () => {
    openDeleteModal([...state.selectedIds]);
  });

  els.batchRestoreBtn.addEventListener("click", () => {
    const count = restoreLogs([...state.selectedIds]);
    showToast(`${count}건을 복원했습니다.`);
  });

  els.saveMoveBtn.addEventListener("click", () => {
    const id = els.moveLogId.value;
    const target = parseTargetValue(els.moveTarget.value);
    if (!target.group || !target.tag) return;
    state.logs = state.logs.map((log) =>
      log.id === id ? moveLog(log, target.group, target.tag, "직접 변경") : log,
    );
    persist();
    els.moveModal.close();
    render();
    showToast("변경했습니다.");
  });

  document.querySelectorAll("[data-ship-action]").forEach((button) => {
    button.addEventListener("click", () => handleShipAction(button.dataset.shipAction));
  });

  els.createStoreContactBtn.addEventListener("click", () => {
    const source = getLogById(els.feedbackLogId.value);
    if (!source) return;
    const extra = els.feedbackMemo.value.trim();
    const memo = extra ? `${source.memo}\n피드백: ${extra}` : source.memo;
    addLog("매장", "연락", memo, `중국 / 피드백대기에서 생성`);
    completeLog(source.id, "매장 연락 생성");
    els.feedbackMemo.value = "";
    els.feedbackModal.close();
    render();
    showToast("매장 연락을 생성했습니다.");
  });

  els.confirmDeleteBtn.addEventListener("click", () => {
    const count = moveLogsToTrash(state.pendingDeleteIds);
    state.pendingDeleteIds = [];
    els.deleteModal.close();
    showToast(`${count}건을 휴지통으로 이동했습니다.`);
  });

  els.emptyTrashBtn.addEventListener("click", () => {
    const count = state.logs.filter((log) => log.deletedAt).length;
    if (!count) {
      showToast("휴지통이 비어 있습니다.");
      return;
    }
    els.emptyTrashSummary.textContent = `휴지통의 ${count}건을 완전 삭제할까요?`;
    els.emptyTrashModal.showModal();
  });

  els.confirmEmptyTrashBtn.addEventListener("click", () => {
    const count = emptyTrash();
    els.emptyTrashModal.close();
    showToast(`${count}건을 완전 삭제했습니다.`);
  });
  els.deleteTagKeepBtn?.addEventListener("click", () => deletePendingTag({ moveLogs: false }));
  els.deleteTagMoveBtn?.addEventListener("click", () => deletePendingTag({ moveLogs: true }));

  els.saveCloudConfigBtn.addEventListener("click", () => {
    saveCloudConfigFromForm();
    renderCloudSettings();
    showToast("클라우드 설정을 저장했습니다.");
  });
  els.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    cloudLogin("auth");
  });
  bindRememberEmailInput(els.authEmailInput);
  bindRememberEmailInput(els.cloudEmailInput);
  els.authSignupBtn.addEventListener("click", () => cloudSignup("auth"));
  els.cloudSignupBtn.addEventListener("click", () => cloudSignup("settings"));
  els.cloudLoginBtn.addEventListener("click", () => cloudLogin("settings"));
  els.cloudSyncBtn.addEventListener("click", () => syncCloud({ showDone: true }));
  els.cloudLogoutBtn.addEventListener("click", () => cloudLogout());
  els.addTripLocationBtn?.addEventListener("click", addTripLocationFromInput);
  ensureOrderElements();
  els.productImageInput?.addEventListener("change", handleProductImageUpload);
  els.applyBulkToProductsBtn?.addEventListener("click", applyBulkToProducts);
  els.clearBulkBtn?.addEventListener("click", clearBulkInputs);
  els.addProductFieldBtn?.addEventListener("click", addProductField);
  els.imageOrderModeBtn?.addEventListener("click", () => focusOrderArea("image"));
  els.textOrderModeBtn?.addEventListener("click", () => focusOrderArea("text"));
  els.existingOrderModeBtn?.addEventListener("click", () => focusOrderArea("existing"));
  els.textOrderForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTextOrder({ share: false });
  });
  els.saveShareTextOrderBtn?.addEventListener("click", () => saveTextOrder({ share: true }));
  els.clearTextOrderBtn?.addEventListener("click", clearTextOrderForm);
  els.orderHistorySearchInput?.addEventListener("input", () => {
    state.orderHistorySearch = els.orderHistorySearchInput.value.trim();
    state.selectedOrderHistoryIds.clear();
    renderOrderHistory();
  });
  els.productSearchInput?.addEventListener("input", () => {
    state.orderSearch = els.productSearchInput.value.trim();
    renderOrderBoard();
  });
  els.imageMarkBoard?.addEventListener("click", addOrderMarker);
  els.addToCartBtn?.addEventListener("click", addSelectedProductToCart);
  els.clearMarkersBtn?.addEventListener("click", () => {
    state.orderMarkers = [];
    renderOrderEditor();
  });
  els.generateOrderImagesBtn?.addEventListener("click", generateOrderImages);
  els.clearCartBtn?.addEventListener("click", clearOrderCart);
  els.saveExistingOrderBtn?.addEventListener("click", saveExistingOrderImages);
  els.exportJsonBtn.addEventListener("click", exportJson);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.importJsonInput.addEventListener("change", importJson);
  els.shareVisibleBtn.addEventListener("click", () => shareLogs(getFilteredLogs()));
  els.shareKakaoBtn.addEventListener("click", () => shareToKakao());
  els.shareSmsBtn.addEventListener("click", () => shareToSms());
  els.shareNativeBtn.addEventListener("click", () => shareBySystem());
  els.copyShareBtn.addEventListener("click", () => copyShareText());
  els.installBtn.addEventListener("click", installApp);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    els.installBtn.hidden = false;
  });

  window.addEventListener("online", () => resumeCloudWork({ force: true }));
  window.addEventListener("offline", renderCloudSettings);
  window.addEventListener("focus", () => resumeCloudWork({ force: true }));
  window.addEventListener("pagehide", flushCloudPush);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushCloudPush();
    else resumeCloudWork({ force: true });
  });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    state.groups = mergeGroupsWithDefaults(saved.groups);
    state.tripLocations = mergeTripLocations(saved.tripLocations || getTripLocationsFromGroups(state.groups));
    state.logs = Array.isArray(saved.logs) ? saved.logs : [];
  } catch {
    state.groups = structuredClone(DEFAULT_GROUPS);
    state.tripLocations = [...DEFAULT_TRIP_LOCATIONS];
    state.logs = [];
  }
}

function loadCloudConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY));
    if (!saved) {
      applyDefaultCloudConfig();
      return;
    }
    state.cloud.url = saved.url || DEFAULT_CLOUD_URL;
    state.cloud.anonKey = saved.anonKey || DEFAULT_CLOUD_ANON_KEY;
    state.cloud.email = normalizeEmail(saved.email || saved.user?.email || getSavedEmail());
    state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
    state.cloud.user = saved.user || null;
    state.cloud.accessToken = saved.accessToken || "";
    state.cloud.refreshToken = saved.refreshToken || "";
    state.cloud.expiresAt = saved.expiresAt || 0;
    state.cloud.lastSyncAt = saved.lastSyncAt || null;
    state.cloud.hasPendingChanges = Boolean(saved.hasPendingChanges);
    state.cloud.pendingSince = saved.pendingSince || null;
    state.cloud.lastErrorAt = saved.lastErrorAt || null;
    state.cloud.lastErrorMessage = saved.lastErrorMessage || "";
  } catch {
    applyDefaultCloudConfig();
  }
}

function loadOrderBoard() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_BOARD_KEY));
    if (!saved) return;
    state.orderFields = mergeOrderFields(saved.fields);
    state.orderProducts = Array.isArray(saved.products) ? saved.products : [];
    state.orderCart = Array.isArray(saved.cart) ? saved.cart : [];
    state.orderHistory = Array.isArray(saved.history) ? saved.history.map(normalizeOrderHistoryEntry) : [];
  } catch {
    state.orderFields = structuredClone(DEFAULT_ORDER_FIELDS);
    state.orderProducts = [];
    state.orderCart = [];
    state.orderHistory = [];
  }
}

function persistOrderBoard(options = {}) {
  const storedProducts = state.orderProducts.map(({ imageData, ...product }) => product);
  const storedCart = state.orderCart.map(({ imageData, ...item }) => item);
  const storedHistory = state.orderHistory.map(({ pageData, ...entry }) => entry);
  try {
    localStorage.setItem(
      ORDER_BOARD_KEY,
      JSON.stringify({
        fields: state.orderFields,
        products: storedProducts,
        cart: storedCart,
        history: storedHistory,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    showToast("이미지 저장 공간이 부족합니다. 불필요한 이미지를 정리해 주세요.");
  }
  if (!options.skipCloud) scheduleCloudPush();
}

function mergeOrderFields(savedFields) {
  const incoming = Array.isArray(savedFields) ? savedFields.filter((field) => field?.id && field?.label) : [];
  const byId = new Map(incoming.map((field) => [field.id, field]));
  const merged = DEFAULT_ORDER_FIELDS.map((field) => ({ ...field, ...(byId.get(field.id) || {}) }));
  incoming.forEach((field) => {
    if (!DEFAULT_ORDER_FIELDS.some((defaultField) => defaultField.id === field.id)) merged.push(field);
  });
  return merged;
}

function normalizeOrderHistoryEntry(entry) {
  if (!entry?.id) return entry;
  const item = Array.isArray(entry.items) ? entry.items[0] || {} : {};
  const category = normalizeOrderCategory(entry.category || item.category);
  const deliveryStatus = normalizeOrderDeliveryStatus(entry.deliveryStatus || item.deliveryStatus);
  const deliveredAt = entry.deliveredAt || item.deliveredAt || "";
  return {
    ...entry,
    category,
    deliveryStatus,
    deliveredAt,
    status: entry.status || item.status || "발주완료",
    customer: entry.customer || item.customer || "",
    quantity: entry.quantity || item.quantity || "",
    price: entry.price || item.price || "",
    dueDate: entry.dueDate || item.dueDate || "",
    sourceLogId: entry.sourceLogId || item.sourceLogId || "",
    items: Array.isArray(entry.items)
      ? entry.items.map((historyItem) => ({
          ...historyItem,
          category: normalizeOrderCategory(historyItem.category || category),
          deliveryStatus: normalizeOrderDeliveryStatus(historyItem.deliveryStatus || deliveryStatus),
          deliveredAt: historyItem.deliveredAt || deliveredAt,
        }))
      : [],
    pages: Array.isArray(entry.pages) ? entry.pages : [],
  };
}

function normalizeOrderCategory(category) {
  return ORDER_CATEGORY_OPTIONS.includes(category) ? category : DEFAULT_ORDER_CATEGORY;
}

function normalizeOrderDeliveryStatus(status) {
  return ORDER_DELIVERY_OPTIONS.includes(status) ? status : DEFAULT_ORDER_DELIVERY_STATUS;
}

function applyDefaultCloudConfig() {
  state.cloud.url = DEFAULT_CLOUD_URL;
  state.cloud.anonKey = DEFAULT_CLOUD_ANON_KEY;
  state.cloud.email = getSavedEmail();
  state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
  state.cloud.user = null;
  state.cloud.accessToken = "";
  state.cloud.refreshToken = "";
  state.cloud.expiresAt = 0;
  state.cloud.lastSyncAt = null;
  state.cloud.hasPendingChanges = false;
  state.cloud.pendingSince = null;
  state.cloud.lastErrorAt = null;
  state.cloud.lastErrorMessage = "";
  state.cloud.retryDelayMs = CLOUD_RETRY_DELAY_MS;
}

function saveCloudConfig() {
  const email = normalizeEmail(state.cloud.email || state.cloud.user?.email || getSavedEmail());
  if (email) rememberEmail(email);
  localStorage.setItem(
    CLOUD_CONFIG_KEY,
    JSON.stringify({
      url: state.cloud.url,
      anonKey: state.cloud.anonKey,
      email,
      enabled: Boolean(state.cloud.enabled),
      user: state.cloud.user,
      accessToken: state.cloud.accessToken,
      refreshToken: state.cloud.refreshToken,
      expiresAt: state.cloud.expiresAt,
      lastSyncAt: state.cloud.lastSyncAt,
      hasPendingChanges: Boolean(state.cloud.hasPendingChanges),
      pendingSince: state.cloud.pendingSince,
      lastErrorAt: state.cloud.lastErrorAt,
      lastErrorMessage: state.cloud.lastErrorMessage,
      savedAt: new Date().toISOString(),
    }),
  );
}

function mergeGroupsWithDefaults(savedGroups) {
  const incoming = Array.isArray(savedGroups) ? savedGroups : [];
  const defaultNames = new Set(DEFAULT_GROUPS.map((group) => group.name));
  const mergedDefaults = DEFAULT_GROUPS.map((defaultGroup) => {
    const saved = incoming.find((group) => group?.name === defaultGroup.name);
    if (!saved) return structuredClone(defaultGroup);

    const tags = defaultGroup.id === "china" ? mergeChinaPreOrderTags(saved.tags) : Array.isArray(saved.tags) ? [...saved.tags] : [];
    defaultGroup.tags.forEach((tag) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
    return {
      ...defaultGroup,
      ...saved,
      id: saved.id || defaultGroup.id,
      name: defaultGroup.name,
      tags,
    };
  });
  const customGroups = incoming.filter((group) => group?.name && !defaultNames.has(group.name));
  return [...mergedDefaults, ...customGroups];
}

function mergeChinaPreOrderTags(savedTags) {
  const customTags = (Array.isArray(savedTags) ? savedTags : [])
    .map((tag) => String(tag || "").trim())
    .filter((tag) => tag && !CHINA_PRE_ORDER_TAGS.includes(tag) && !CHINA_LEGACY_ORDER_TAGS.includes(tag));
  return [...CHINA_PRE_ORDER_TAGS, ...customTags];
}

function getTripGroup() {
  return state.groups.find((group) => group.id === TRIP_GROUP_ID) || state.groups.find((group) => group.name === "중국출장");
}

function isTripGroup(groupName) {
  const group = state.groups.find((item) => item.name === groupName);
  return group?.id === TRIP_GROUP_ID || groupName === "중국출장";
}

function mergeTripLocations(locations) {
  const merged = [];
  (Array.isArray(locations) ? locations : []).forEach((location) => {
    const normalized = String(location || "").trim();
    if (normalized && !merged.includes(normalized)) merged.push(normalized);
  });
  return merged.length ? merged : [...DEFAULT_TRIP_LOCATIONS];
}

function getTripLocationsFromGroups(groups) {
  const tripGroup = (Array.isArray(groups) ? groups : []).find((group) => group?.id === TRIP_GROUP_ID || group?.name === "중국출장");
  return Array.isArray(tripGroup?.locations) ? tripGroup.locations : [];
}

function decorateGroupsWithTripLocations(groups) {
  return (Array.isArray(groups) ? groups : []).map((group) =>
    group?.id === TRIP_GROUP_ID || group?.name === "중국출장" ? { ...group, locations: state.tripLocations } : group,
  );
}

function persist(options = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      groups: decorateGroupsWithTripLocations(state.groups),
      tripLocations: state.tripLocations,
      logs: state.logs,
      savedAt: new Date().toISOString(),
    }),
  );
  if (!options.skipCloud) scheduleCloudPush();
}

function normalizeSelection() {
  const group = state.groups.find((item) => item.name === state.selectedGroup) || state.groups[0];
  state.selectedGroup = group.name;
  state.selectedTag = group.tags.includes(state.selectedTag) ? state.selectedTag : group.tags[0];
  state.tripLocations = mergeTripLocations(state.tripLocations);
  if (!state.tripLocations.includes(state.selectedTripLocation)) state.selectedTripLocation = state.tripLocations[0];
}

function render() {
  const signedIn = isCloudSignedIn();
  document.body.classList.toggle("is-authenticated", signedIn);
  document.querySelectorAll(".module-tab[data-module]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.module === state.module);
  });
  document.querySelector("#logsModule").classList.toggle("is-visible", state.module === "logs");
  document.querySelector("#orderImageModule").classList.toggle("is-visible", state.module === "orderImage");
  document.querySelector("#settingsModule").classList.toggle("is-visible", state.module === "settings");

  renderOrderBoard();
  renderAuthGate();
  renderPickers();
  renderFilters();
  renderCounts();
  renderLogs();
  renderBatchBar();
  renderSettings();
  renderCloudSettings();
}

function isCloudSignedIn() {
  return Boolean(state.cloud.user && (state.cloud.accessToken || state.cloud.refreshToken));
}

function normalizeEmail(email) {
  return String(email || "").trim();
}

function getSavedEmail() {
  try {
    for (const key of EMAIL_STORAGE_KEYS) {
      const email = normalizeEmail(localStorage.getItem(key));
      if (email) return email;
    }
    const saved = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY));
    return normalizeEmail(saved?.email || saved?.user?.email);
  } catch {
    return "";
  }
}

function rememberEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  state.cloud.email = normalized;
  try {
    EMAIL_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, normalized));
    setLoginEmailInputs(normalized);
  } catch {
    // Email memory is a convenience only; login still works without it.
  }
}

function setLoginEmailInputs(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  [els.authEmailInput, els.cloudEmailInput].forEach((input) => {
    if (!input) return;
    if (document.activeElement === input && normalizeEmail(input.value)) return;
    input.value = normalized;
  });
}

function bindRememberEmailInput(input) {
  if (!input) return;
  const save = () => rememberEmail(input.value);
  input.addEventListener("input", save);
  input.addEventListener("change", save);
  input.addEventListener("blur", save);
}

function resetLogView() {
  state.status = "active";
  state.search = "";
  state.tagFilter = "";
  state.locationFilter = "";
  state.listGroupFilter = "";
  state.selectedIds.clear();
  if (els.searchInput) els.searchInput.value = "";
  if (els.tagFilter) els.tagFilter.value = "";
  if (els.tripLocationFilter) els.tripLocationFilter.value = "";
}

function focusLogViewOnSelectedTag() {
  state.listGroupFilter = state.selectedGroup;
  state.tagFilter = tagFilterValue(state.selectedGroup, state.selectedTag);
  state.search = "";
  if (!isTripGroup(state.selectedGroup)) state.locationFilter = "";
  state.selectedIds.clear();
}

function syncSelectionFromTagFilter() {
  if (!state.tagFilter) return;
  const selected = parseTagFilter(state.tagFilter);
  const group = getGroup(selected.group);
  if (!group?.tags.includes(selected.tag)) return;
  state.selectedGroup = group.name;
  state.selectedTag = selected.tag;
  state.listGroupFilter = group.name;
  if (!isTripGroup(group.name)) state.locationFilter = "";
}

function renderAuthGate() {
  if (!els.authGate) return;
  const signedIn = isCloudSignedIn();
  document.body.classList.toggle("is-authenticated", signedIn);
  els.authGate.hidden = signedIn;
  if (!signedIn) setLoginEmailInputs(state.cloud.email || getSavedEmail());
  if (els.authStatus) {
    if (state.cloud.isSyncing) {
      els.authStatus.textContent = "클라우드에 연결하는 중입니다.";
    } else if (signedIn) {
      els.authStatus.textContent = `${state.cloud.user.email || "로그인됨"} 계정으로 연결되었습니다.`;
    } else {
      els.authStatus.textContent = "이메일과 비밀번호로 로그인하면 PC, 태블릿, 휴대폰에서 같은 로그를 볼 수 있습니다.";
    }
  }
  if (els.authLoginBtn) els.authLoginBtn.disabled = state.cloud.isSyncing;
  if (els.authSignupBtn) els.authSignupBtn.disabled = state.cloud.isSyncing;
}

function renderPickers() {
  els.groupPicker.replaceChildren(
    ...state.groups.map((group) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = group.name;
      button.classList.toggle("is-active", group.name === state.selectedGroup);
      button.addEventListener("click", () => {
        state.selectedGroup = group.name;
        state.selectedTag = group.tags[0];
        if (isTripGroup(group.name) && !state.tripLocations.includes(state.selectedTripLocation)) {
          state.selectedTripLocation = state.tripLocations[0];
        }
        focusLogViewOnSelectedTag();
        render();
      });
      return button;
    }),
  );

  const group = getGroup(state.selectedGroup);
  els.tagPicker.replaceChildren(
    ...group.tags.map((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = tag;
      button.classList.toggle("is-active", tag === state.selectedTag);
      button.addEventListener("click", () => {
        state.selectedTag = tag;
        focusLogViewOnSelectedTag();
        render();
      });
      return button;
    }),
  );

  renderTripLocationPicker();
}

function renderTripLocationPicker() {
  if (!els.tripLocationField || !els.tripLocationPicker) return;
  const showLocations = isTripGroup(state.selectedGroup);
  els.tripLocationField.hidden = !showLocations;
  if (!showLocations) {
    els.tripLocationPicker.replaceChildren();
    return;
  }
  state.tripLocations = mergeTripLocations(state.tripLocations);
  if (!state.tripLocations.includes(state.selectedTripLocation)) state.selectedTripLocation = state.tripLocations[0];
  els.tripLocationPicker.replaceChildren(
    ...state.tripLocations.map((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = location;
      button.classList.toggle("is-active", location === state.selectedTripLocation);
      button.addEventListener("click", () => {
        state.selectedTripLocation = location;
        renderTripLocationPicker();
      });
      return button;
    }),
  );
}

function renderFilters() {
  renderListGroupPicker();
  const current = state.tagFilter;
  const validValues = state.groups.flatMap((group) => group.tags.map((tag) => tagFilterValue(group.name, tag)));
  els.tagFilter.replaceChildren(option("", "전체 태그"), ...state.groups.map(renderTagGroup));
  els.tagFilter.value = validValues.includes(current) ? current : "";
  state.tagFilter = els.tagFilter.value;
  renderLocationFilter();
  els.searchInput.value = state.search;
  els.sortSelect.value = state.sortMode;
}

function renderLocationFilter() {
  if (!els.tripLocationFilterWrap || !els.tripLocationFilter) return;
  const showLocationFilter = isTripGroup(state.listGroupFilter);
  els.tripLocationFilterWrap.hidden = !showLocationFilter;
  if (!showLocationFilter) {
    state.locationFilter = "";
    els.tripLocationFilter.replaceChildren();
    return;
  }
  state.tripLocations = mergeTripLocations(state.tripLocations);
  const validLocations = new Set(state.tripLocations);
  if (state.locationFilter && !validLocations.has(state.locationFilter)) state.locationFilter = "";
  els.tripLocationFilter.replaceChildren(
    option("", "전체 장소"),
    ...state.tripLocations.map((location) => option(location, location)),
  );
  els.tripLocationFilter.value = state.locationFilter;
}

function renderTagGroup(group) {
  const optgroup = document.createElement("optgroup");
  optgroup.label = group.name;
  optgroup.append(...group.tags.map((tag) => option(tagFilterValue(group.name, tag), tag)));
  return optgroup;
}

function tagFilterValue(groupName, tag) {
  return `${groupName}::${tag}`;
}

function parseTagFilter(value) {
  const [group, ...tagParts] = String(value || "").split("::");
  return { group, tag: tagParts.join("::") };
}

function renderListGroupPicker() {
  const groups = [{ name: "", label: "전체" }, ...state.groups.map((group) => ({ name: group.name, label: group.name }))];
  els.listGroupPicker.replaceChildren(
    ...groups.map((group) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = group.label;
      button.classList.toggle("is-active", group.name === state.listGroupFilter);
      button.addEventListener("click", () => {
        state.listGroupFilter = group.name;
        state.tagFilter = "";
        state.locationFilter = "";
        state.selectedIds.clear();
        renderFilters();
        renderLogs();
        renderBatchBar();
      });
      return button;
    }),
  );
}

function renderCounts() {
  const active = state.logs.filter((log) => !log.deletedAt && !log.completedAt).length;
  const done = state.logs.filter((log) => !log.deletedAt && log.completedAt).length;
  const trash = state.logs.filter((log) => log.deletedAt).length;
  const byGroup = state.groups.map((group) => {
    const count = state.logs.filter((log) => !log.deletedAt && !log.completedAt && log.group === group.name).length;
    return `${group.name} ${count}`;
  });
  els.statusCounts.replaceChildren(
    ...[`진행 ${active}`, `완료 ${done}`, `휴지통 ${trash}`, ...byGroup].map((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      return span;
    }),
  );
}

function renderLogs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.status === state.status);
  });

  const visible = getFilteredLogs();
  const trashCount = state.logs.filter((log) => log.deletedAt).length;
  els.emptyTrashBtn.hidden = state.status !== "trash" || trashCount === 0;
  els.selectAllBtn.textContent =
    visible.length > 0 && visible.every((log) => state.selectedIds.has(log.id)) ? "선택해제" : "전체선택";

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      state.status === "trash"
        ? "휴지통이 비어 있습니다."
        : state.status === "done"
          ? "완료된 기록이 없습니다."
          : "진행중 기록이 없습니다.";
    els.logList.replaceChildren(empty);
    renderBatchBar();
    return;
  }

  els.logList.replaceChildren(...visible.map((log) => renderLogCard(log)));
  renderBatchBar();
}

function renderLogCard(log) {
  const card = document.createElement("article");
  card.className = "log-card";
  card.dataset.group = log.group;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.selectedIds.has(log.id);
  checkbox.setAttribute("aria-label", "로그 선택");
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) state.selectedIds.add(log.id);
    else state.selectedIds.delete(log.id);
    renderBatchBar();
  });

  const main = document.createElement("div");
  main.className = "log-main";

  const meta = document.createElement("div");
  meta.className = "log-meta";
  meta.append(pill(log.group, groupClass(log.group)), pill(log.tag), timeLabel(log.createdAt));
  if (log.location && isTripGroup(log.group)) meta.append(pill(log.location));
  if (log.completedAt) meta.append(pill("완료"));
  if (log.deletedAt) meta.append(pill("휴지통"));

  const memo = document.createElement("p");
  memo.className = "memo";
  memo.textContent = log.memo;

  const actions = document.createElement("div");
  actions.className = "log-actions";
  if (log.deletedAt) {
    actions.append(actionButton("복원", () => restoreLogs([log.id]), true));
    actions.append(actionButton("공유", () => shareLogs([log])));
  } else {
    getActionsForLog(log).forEach((action) => actions.append(actionButton(action.label, action.handler, action.important)));
    actions.append(actionButton("이동", () => openMoveModal(log.id)));
    actions.append(actionButton("공유", () => shareLogs([log])));
    actions.append(actionButton("삭제", () => openDeleteModal([log.id]), false, "danger"));
  }

  main.append(meta, memo, actions);

  const lastHistory = log.history?.at(-1);
  if (lastHistory) {
    const history = document.createElement("div");
    history.className = "history-line";
    history.textContent = `${formatDate(lastHistory.at)} · ${lastHistory.note}`;
    main.append(history);
  }

  card.append(checkbox, main);
  return card;
}

function getActionsForLog(log) {
  if (log.completedAt) {
    return [{ label: "진행중으로", important: true, handler: () => {
      const count = reopenLogs([log.id]);
      showToast(`${count}건을 진행중으로 옮겼습니다.`);
    } }];
  }
  if (log.group === "중국") {
    const actions = [{ label: "발주로 등록", important: true, handler: () => prepareTextOrderFromLog(log) }];
    if (log.tag === "확인") {
      actions.push({
        label: "문의 완료",
        handler: () => {
          state.logs = state.logs.map((item) =>
            item.id === log.id ? moveLog(item, "중국", "피드백대기", "문의 완료 → 피드백대기") : item,
          );
          persist();
          render();
          showToast("피드백대기로 이동했습니다.");
        },
      });
      return actions;
    }
    if (log.tag === "피드백대기") {
      actions.push(
        { label: "완료", handler: () => completeLog(log.id, "피드백 완료") },
        { label: "매장 연락 생성", handler: () => openFeedbackModal(log.id) },
      );
      return actions;
    }
    actions.push({ label: "완료", handler: () => completeLog(log.id, "완료") });
    return actions;
  }
  if (log.group === "중국" && log.tag === "확인") {
    return [
      {
        label: "문의 완료",
        important: true,
        handler: () => {
          state.logs = state.logs.map((item) =>
            item.id === log.id ? moveLog(item, "중국", "피드백대기", "문의 완료 → 피드백대기") : item,
          );
          persist();
          render();
          showToast("피드백대기로 이동했습니다.");
        },
      },
    ];
  }
  if (log.group === "중국" && log.tag === "피드백대기") {
    return [
      { label: "완료", important: true, handler: () => completeLog(log.id, "피드백 완료") },
      { label: "매장 연락 생성", handler: () => openFeedbackModal(log.id) },
    ];
  }
  if (log.group === "매장" && log.tag === "출고") {
    return [{ label: "출고 완료", important: true, handler: () => openShipModal(log.id) }];
  }
  return [{ label: "완료", important: true, handler: () => completeLog(log.id, "완료") }];
}

function renderBatchBar() {
  const count = state.selectedIds.size;
  els.batchBar.hidden = count === 0;
  els.selectedCount.textContent = `${count}건 선택`;
  const inTrash = state.status === "trash";
  const inDone = state.status === "done";
  const selectedLogs = [...state.selectedIds].map(getLogById).filter(Boolean);
  const canBatchShip =
    !inTrash && !inDone && selectedLogs.length > 0 && selectedLogs.every((log) => isActiveStoreShipmentLog(log));
  els.batchTarget.hidden = inTrash || inDone;
  els.applyBatchBtn.hidden = inTrash || inDone;
  if (els.batchShipAction) els.batchShipAction.hidden = !canBatchShip;
  if (els.batchShipBtn) els.batchShipBtn.hidden = !canBatchShip;
  if (els.batchReopenBtn) els.batchReopenBtn.hidden = !inDone;
  els.batchDeleteBtn.hidden = inTrash;
  els.batchRestoreBtn.hidden = !inTrash;
  renderTargetOptions(els.batchTarget);
}

function renderSettings() {
  els.settingsGroups.replaceChildren(
    ...state.groups.map((group) => {
      const card = document.createElement("section");
      card.className = "settings-card";

      const heading = document.createElement("h3");
      heading.textContent = group.name;

      const editor = document.createElement("div");
      editor.className = "tag-editor";

      group.tags.forEach((tag, index) => {
        const row = document.createElement("div");
        row.className = "tag-row";

        const input = document.createElement("input");
        input.value = tag;
        input.setAttribute("aria-label", `${group.name} 태그 이름`);
        input.addEventListener("change", () => renameTag(group.name, tag, input.value.trim()));

        const up = smallButton("↑", () => reorderTag(group.name, index, index - 1), index === 0);
        const down = smallButton("↓", () => reorderTag(group.name, index, index + 1), index === group.tags.length - 1);
        const save = smallButton("✓", () => renameTag(group.name, tag, input.value.trim()), false);
        const remove = smallButton("삭제", () => openTagDeleteModal(group.name, tag), false);

        row.append(input, up, down, save, remove);
        editor.append(row);
      });

      const addRow = document.createElement("div");
      addRow.className = "add-tag-row";
      const addInput = document.createElement("input");
      addInput.placeholder = "새 태그";
      addInput.setAttribute("aria-label", `${group.name} 새 태그`);
      const add = smallButton("+", () => {
        addTag(group.name, addInput.value.trim());
        addInput.value = "";
      });
      addRow.append(addInput, add);
      editor.append(addRow);

      card.append(heading, editor);
      return card;
    }),
  );
  renderTripLocationSettings();
}

function renderTripLocationSettings() {
  if (!els.tripLocationList) return;
  state.tripLocations = mergeTripLocations(state.tripLocations);
  els.tripLocationList.replaceChildren(
    ...state.tripLocations.map((location, index) => {
      const row = document.createElement("div");
      row.className = "tag-row trip-location-row";
      row.dataset.location = location;
      row.classList.toggle("is-dragging", state.draggingTripLocation === location);

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "drag-handle";
      handle.textContent = "이동";
      handle.setAttribute("aria-label", `${location} 순서 이동`);
      handle.addEventListener("pointerdown", (event) => startTripLocationDrag(event, location));

      const input = document.createElement("input");
      input.value = location;
      input.setAttribute("aria-label", "중국출장 장소 이름");
      input.addEventListener("change", () => renameTripLocation(location, input.value.trim()));

      const actions = document.createElement("div");
      actions.className = "trip-location-actions";
      const up = smallButton("위", () => reorderTripLocation(index, index - 1), index === 0);
      const down = smallButton("아래", () => reorderTripLocation(index, index + 1), index === state.tripLocations.length - 1);
      const save = smallButton("저장", () => renameTripLocation(location, input.value.trim()));
      const remove = smallButton("삭제", () => removeTripLocation(location));
      actions.append(up, down, save, remove);

      row.append(handle, input, actions);
      return row;
    }),
  );
  if (els.newTripLocationInput) els.newTripLocationInput.value = "";
}

function renderCloudSettings() {
  if (!els.cloudStatus) return;
  renderAuthGate();
  renderSyncState();
  els.cloudUrlInput.value = state.cloud.url;
  els.cloudAnonKeyInput.value = state.cloud.anonKey;
  if (document.activeElement !== els.cloudEmailInput) {
    els.cloudEmailInput.value = state.cloud.email || getSavedEmail();
  }
  els.cloudPasswordInput.value = "";

  const parts = [];
  if (!state.cloud.url || !state.cloud.anonKey) {
    parts.push("Supabase 주소와 anon key를 입력하면 클라우드 동기화를 사용할 수 있습니다.");
  } else if (!state.cloud.user || (!state.cloud.accessToken && !state.cloud.refreshToken)) {
    parts.push("클라우드 설정 저장됨. 가입 또는 로그인 후 동기화할 수 있습니다.");
  } else {
    parts.push(`${state.cloud.user.email || "로그인됨"} 계정으로 연결됨.`);
    parts.push("자동 동기화 켜짐.");
  }
  if (state.cloud.lastSyncAt) parts.push(`마지막 동기화: ${formatDate(state.cloud.lastSyncAt)}`);
  if (state.cloud.isSyncing) parts.push("동기화 중...");
  if (!navigator.onLine) parts.push("인터넷 연결 대기 중.");
  if (state.cloud.hasPendingChanges) parts.push("저장 대기 중. 연결되면 자동으로 다시 저장합니다.");
  if (state.cloud.lastErrorMessage) parts.push(`마지막 저장 실패: ${state.cloud.lastErrorMessage}`);
  els.cloudStatus.textContent = parts.join(" ");

  els.cloudSyncBtn.disabled =
    state.cloud.isSyncing || !state.cloud.user || (!state.cloud.accessToken && !state.cloud.refreshToken);
  els.cloudLoginBtn.disabled = state.cloud.isSyncing;
  els.cloudSignupBtn.disabled = state.cloud.isSyncing;
  els.cloudLogoutBtn.disabled = state.cloud.isSyncing || !state.cloud.user;
}

function renderSyncState() {
  if (!els.syncPill) return;
  const status = syncStatusInfo();
  els.syncPill.textContent = status.label;
  els.syncPill.dataset.status = status.status;
  els.syncPill.hidden = false;
}

function syncStatusInfo() {
  if (!navigator.onLine) return { status: "offline", label: "오프라인" };
  if (!state.cloud.enabled || !isCloudSignedIn()) return { status: "signed-out", label: "로그인 필요" };
  if (state.cloud.isSyncing) return { status: "syncing", label: "저장 중" };
  if (state.cloud.lastErrorMessage) return { status: "error", label: "저장 확인" };
  if (state.cloud.hasPendingChanges) return { status: "pending", label: "저장 대기" };
  if (state.cloud.lastSyncAt) return { status: "saved", label: "저장 완료" };
  return { status: "ready", label: "연결됨" };
}

function saveCloudConfigFromForm() {
  state.cloud.url = els.cloudUrlInput.value.trim().replace(/\/$/, "");
  state.cloud.anonKey = els.cloudAnonKeyInput.value.trim();
  state.cloud.email = normalizeEmail(els.cloudEmailInput.value) || state.cloud.email || getSavedEmail();
  rememberEmail(state.cloud.email);
  state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
  saveCloudConfig();
}

function saveCloudConfigFromAuthForm() {
  state.cloud.url = state.cloud.url || DEFAULT_CLOUD_URL;
  state.cloud.anonKey = state.cloud.anonKey || DEFAULT_CLOUD_ANON_KEY;
  state.cloud.email = normalizeEmail(els.authEmailInput.value) || state.cloud.email || getSavedEmail();
  rememberEmail(state.cloud.email);
  state.cloud.enabled = Boolean(state.cloud.url && state.cloud.anonKey);
  saveCloudConfig();
}

function saveCloudConfigFromSource(source) {
  if (source === "auth") {
    saveCloudConfigFromAuthForm();
    return;
  }
  saveCloudConfigFromForm();
}

function getCloudPassword(source) {
  return source === "auth" ? els.authPasswordInput.value : els.cloudPasswordInput.value;
}

function ensureCloudReady() {
  if (!state.cloud.enabled) throw new Error("Supabase 설정이 필요합니다.");
}

async function initializeCloudSession() {
  if (!state.cloud.enabled) {
    renderCloudSettings();
    return;
  }
  try {
    await ensureCloudAccess();
    renderCloudSettings();
    if (state.cloud.user) {
      if (state.cloud.hasPendingChanges) {
        await pushPendingCloudState({ silent: true, force: true }).catch(() => {});
      }
      if (!state.cloud.hasPendingChanges) await syncCloud({ silent: true });
      startAutoSync();
    }
  } catch {
    stopAutoSync();
    renderCloudSettings();
  }
}

async function cloudSignup(source = "settings") {
  saveCloudConfigFromSource(source);
  const password = getCloudPassword(source);
  if (!state.cloud.email || !password) {
    showToast("이메일과 비밀번호를 입력하세요.");
    return;
  }
  await runCloudTask(async () => {
    const data = await cloudAuthRequest("signup", { email: state.cloud.email, password });
    applyCloudAuth(data);
    if (state.cloud.accessToken) {
      state.module = "logs";
      resetLogView();
      await syncCloud({ silent: true, resetView: true });
      startAutoSync();
      showToast("가입하고 클라우드에 연결했습니다.");
    } else {
      showToast("가입 메일을 확인한 뒤 로그인하세요.");
    }
  });
}

async function cloudLogin(source = "settings") {
  saveCloudConfigFromSource(source);
  const password = getCloudPassword(source);
  if (!state.cloud.email || !password) {
    showToast("이메일과 비밀번호를 입력하세요.");
    return;
  }
  await runCloudTask(async () => {
    const data = await cloudAuthRequest("token?grant_type=password", { email: state.cloud.email, password });
    applyCloudAuth(data);
    state.module = "logs";
    resetLogView();
    await syncCloud({ silent: true, resetView: true });
    startAutoSync();
    showToast("클라우드에 로그인했습니다.");
  });
}

async function cloudLogout() {
  await runCloudTask(async () => {
    if (state.cloud.accessToken) {
      await fetch(`${state.cloud.url}/auth/v1/logout`, {
        method: "POST",
        headers: cloudHeaders({ auth: true }),
      }).catch(() => {});
    }
    state.cloud.user = null;
    state.cloud.accessToken = "";
    state.cloud.refreshToken = "";
    state.cloud.expiresAt = 0;
    stopAutoSync();
    saveCloudConfig();
    showToast("로그아웃했습니다.");
  });
}

async function cloudAuthRequest(path, body) {
  ensureCloudReady();
  const response = await fetch(`${state.cloud.url}/auth/v1/${path}`, {
    method: "POST",
    headers: cloudHeaders(),
    body: JSON.stringify(body),
  });
  return parseCloudResponse(response);
}

function applyCloudAuth(data) {
  state.cloud.user = data.user || null;
  state.cloud.accessToken = data.access_token || state.cloud.accessToken || "";
  state.cloud.refreshToken = data.refresh_token || state.cloud.refreshToken || "";
  state.cloud.expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : state.cloud.expiresAt;
  if (state.cloud.user?.email) rememberEmail(state.cloud.user.email);
  saveCloudConfig();
}

async function ensureCloudAccess() {
  ensureCloudReady();
  if (state.cloud.accessToken && Date.now() < state.cloud.expiresAt - 60000) return state.cloud.accessToken;
  if (!state.cloud.refreshToken) {
    if (state.cloud.accessToken) return state.cloud.accessToken;
    throw new Error("클라우드 로그인이 필요합니다.");
  }
  const data = await cloudAuthRequest("token?grant_type=refresh_token", {
    refresh_token: state.cloud.refreshToken,
  });
  applyCloudAuth(data);
  return state.cloud.accessToken;
}

async function runCloudTask(task) {
  state.cloud.isSyncing = true;
  renderCloudSettings();
  try {
    await task();
  } catch (error) {
    showToast(error.message || "클라우드 작업에 실패했습니다.");
  } finally {
    state.cloud.isSyncing = false;
    renderCloudSettings();
  }
}

function startAutoSync() {
  if (!isCloudSignedIn()) return;
  stopAutoSync();
  state.cloud.autoSyncTimer = setInterval(() => {
    runAutoSync();
  }, AUTO_SYNC_INTERVAL_MS);
}

function stopAutoSync() {
  clearInterval(state.cloud.autoSyncTimer);
  state.cloud.autoSyncTimer = null;
}

function runAutoSync(options = {}) {
  if (!state.cloud.enabled || !isCloudSignedIn() || state.cloud.isSyncing || !navigator.onLine) return;
  if (document.hidden && !options.force) return;
  if (state.cloud.hasPendingChanges) {
    pushPendingCloudState({ silent: true }).catch(() => {});
    return;
  }
  syncCloud({ silent: true }).catch(() => {});
}

function resumeCloudWork(options = {}) {
  renderCloudSettings();
  if (!state.cloud.enabled || !isCloudSignedIn()) return;
  if (state.cloud.hasPendingChanges) {
    scheduleCloudPush(0);
    return;
  }
  runAutoSync(options);
}

function scheduleCloudPush(delay = CLOUD_PUSH_DELAY_MS) {
  if (!state.cloud.enabled || !state.cloud.user) return;
  markCloudChangeQueued();
  clearTimeout(state.cloud.pushTimer);
  state.cloud.pushTimer = setTimeout(() => {
    pushPendingCloudState({ silent: true }).catch(() => {});
  }, delay);
}

function flushCloudPush() {
  if (!state.cloud.enabled || !isCloudSignedIn() || state.cloud.isSyncing) return;
  clearTimeout(state.cloud.pushTimer);
  if (state.cloud.hasPendingChanges) {
    pushPendingCloudState({ silent: true, keepalive: true }).catch(() => {});
  }
}

function markCloudChangeQueued() {
  if (!state.cloud.enabled || !state.cloud.user) return;
  state.cloud.hasPendingChanges = true;
  state.cloud.pendingSince ||= new Date().toISOString();
  state.cloud.lastErrorMessage = "";
  state.cloud.lastErrorAt = null;
  saveCloudConfig();
  renderCloudSettings();
}

function markCloudPushSucceeded() {
  state.cloud.hasPendingChanges = false;
  state.cloud.pendingSince = null;
  state.cloud.lastErrorMessage = "";
  state.cloud.lastErrorAt = null;
  state.cloud.retryDelayMs = CLOUD_RETRY_DELAY_MS;
  clearTimeout(state.cloud.retryTimer);
  state.cloud.retryTimer = null;
  saveCloudConfig();
  renderCloudSettings();
}

function markCloudPushFailed(error) {
  state.cloud.hasPendingChanges = true;
  state.cloud.pendingSince ||= new Date().toISOString();
  state.cloud.lastErrorAt = new Date().toISOString();
  state.cloud.lastErrorMessage = readableCloudError(error);
  saveCloudConfig();
  renderCloudSettings();
  scheduleCloudRetry();
}

function scheduleCloudRetry() {
  if (!state.cloud.enabled || !isCloudSignedIn()) return;
  clearTimeout(state.cloud.retryTimer);
  const delay = state.cloud.retryDelayMs || CLOUD_RETRY_DELAY_MS;
  state.cloud.retryTimer = setTimeout(() => {
    pushPendingCloudState({ silent: true }).catch(() => {});
  }, delay);
  state.cloud.retryDelayMs = Math.min(delay * 2, CLOUD_RETRY_MAX_DELAY_MS);
}

function readableCloudError(error) {
  if (!navigator.onLine) return "인터넷 연결 대기 중";
  const message = String(error?.message || error || "").trim();
  if (!message) return "자동 저장 재시도 중";
  return message.length > 80 ? `${message.slice(0, 80)}...` : message;
}

async function pushPendingCloudState(options = {}) {
  if (!state.cloud.enabled || !isCloudSignedIn()) return;
  if (state.cloud.isSyncing && !options.force) {
    scheduleCloudPush(Math.max(CLOUD_PUSH_DELAY_MS, 1000));
    return;
  }
  if (!navigator.onLine) {
    markCloudPushFailed(new Error("인터넷 연결 대기 중"));
    return;
  }
  clearTimeout(state.cloud.pushTimer);
  state.cloud.isSyncing = true;
  renderCloudSettings();
  try {
    await Promise.all([
      pushCloudState({ silent: true, keepalive: Boolean(options.keepalive) }),
      pushOrderBoardState({ silent: true, keepalive: Boolean(options.keepalive) }),
    ]);
    state.cloud.lastSyncAt = new Date().toISOString();
    markCloudPushSucceeded();
    if (!options.silent) showToast("클라우드에 저장했습니다.");
  } catch (error) {
    markCloudPushFailed(error);
    if (!options.silent) showToast("저장에 실패했습니다. 자동으로 다시 시도합니다.");
    throw error;
  } finally {
    state.cloud.isSyncing = false;
    renderCloudSettings();
  }
}

async function syncCloud(options = {}) {
  if (!state.cloud.enabled || !state.cloud.user) {
    if (!options.silent) showToast("클라우드 로그인 후 동기화할 수 있습니다.");
    return;
  }
  state.cloud.isSyncing = true;
  renderCloudSettings();
  try {
    const [settingsRows, rows] = await Promise.all([
      cloudDataRequest("ops_settings?select=groups,updated_at&limit=1"),
      cloudDataRequest("ops_logs?select=*"),
    ]);
    const settings = settingsRows?.[0];

    state.groups = mergeGroupSets(state.groups, settings?.groups);
    state.tripLocations = mergeTripLocations([...state.tripLocations, ...getTripLocationsFromGroups(state.groups)]);
    state.logs = mergeLogsForSync(state.logs, (rows || []).map(cloudRowToLog));
    await syncOrderBoardState();
    state.selectedIds.clear();
    if (options.resetView) resetLogView();
    normalizeSelection();
    persist({ skipCloud: true });
    render();
    await pushCloudState({ silent: true });
    await pushOrderBoardState({ silent: true });
    markCloudPushSucceeded();
    if (options.showDone) showToast("클라우드 동기화가 끝났습니다.");
  } catch (error) {
    if (!options.silent) showToast(error.message || "클라우드 동기화에 실패했습니다.");
  } finally {
    state.cloud.isSyncing = false;
    renderCloudSettings();
  }
}

async function pushCloudState(options = {}) {
  if (!state.cloud.enabled || !state.cloud.user) return;
  const now = new Date().toISOString();
  await cloudDataRequest("ops_settings?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    keepalive: Boolean(options.keepalive),
    body: {
      user_id: state.cloud.user.id,
      groups: decorateGroupsWithTripLocations(state.groups),
      updated_at: now,
    },
  });

  if (state.logs.length) {
    await cloudDataRequest("ops_logs?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      keepalive: Boolean(options.keepalive),
      body: state.logs.map((log) => logToCloudRow(log, state.cloud.user.id)),
    });
  }
  state.cloud.lastSyncAt = now;
  renderCloudSettings();
  if (!options.silent) showToast("클라우드에 저장했습니다.");
}

async function syncOrderBoardState() {
  if (!state.cloud.enabled || !state.cloud.user) return;
  const [settingsRows, productRows, historyRows] = await Promise.all([
    cloudDataRequest("order_image_settings?select=fields,updated_at&limit=1"),
    cloudDataRequest("order_products?select=*"),
    cloudDataRequest("order_history?select=*"),
  ]);
  const settings = settingsRows?.[0];
  if (settings?.fields) state.orderFields = mergeOrderFields(settings.fields);
  state.orderProducts = mergeOrderProducts(state.orderProducts, (productRows || []).map(cloudRowToOrderProduct));
  state.orderHistory = mergeOrderHistory(state.orderHistory, (historyRows || []).map(cloudRowToOrderHistory));
  persistOrderBoard({ skipCloud: true });
}

async function pushOrderBoardState(options = {}) {
  if (!state.cloud.enabled || !state.cloud.user) return;
  const now = new Date().toISOString();
  await cloudDataRequest("order_image_settings?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    keepalive: Boolean(options.keepalive),
    body: {
      user_id: state.cloud.user.id,
      fields: state.orderFields,
      updated_at: now,
    },
  });

  if (state.orderProducts.length) {
    await cloudDataRequest("order_products?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      keepalive: Boolean(options.keepalive),
      body: state.orderProducts.map((product) => orderProductToCloudRow(product, state.cloud.user.id)),
    });
  }

  if (state.orderHistory.length) {
    await cloudDataRequest("order_history?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      keepalive: Boolean(options.keepalive),
      body: state.orderHistory.map((entry) => orderHistoryToCloudRow(entry, state.cloud.user.id)),
    });
  }

  if (!options.silent) showToast("발주 이미지판을 클라우드에 저장했습니다.");
}

async function deleteCloudLogs(ids) {
  if (!ids.length || !state.cloud.enabled || !state.cloud.user) return;
  try {
    await cloudDataRequest(`ops_logs?id=in.(${ids.map((id) => `"${id}"`).join(",")})`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
  } catch {
    // Local deletion is kept even if the network is temporarily unavailable.
  }
}

async function cloudDataRequest(path, options = {}) {
  await ensureCloudAccess();
  const response = await fetch(`${state.cloud.url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: cloudHeaders({ auth: true, prefer: options.prefer }),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    keepalive: Boolean(options.keepalive),
  });
  if (response.status === 401 && state.cloud.refreshToken && !options._retried) {
    state.cloud.accessToken = "";
    await ensureCloudAccess();
    return cloudDataRequest(path, { ...options, _retried: true });
  }
  return parseCloudResponse(response);
}

function cloudHeaders(options = {}) {
  const headers = {
    apikey: state.cloud.anonKey,
    "Content-Type": "application/json",
  };
  if (options.auth && state.cloud.accessToken) headers.Authorization = `Bearer ${state.cloud.accessToken}`;
  if (options.prefer) headers.Prefer = options.prefer;
  return headers;
}

async function parseCloudResponse(response) {
  if (response.ok) {
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  const text = await response.text();
  let message = text || `클라우드 요청 실패 (${response.status})`;
  try {
    const payload = JSON.parse(text);
    message = payload.msg || payload.message || payload.error_description || message;
  } catch {
    // Keep the plain response text.
  }
  throw new Error(message);
}

function mergeGroupSets(localGroups, remoteGroups) {
  const combined = mergeGroupsWithDefaults(remoteGroups || localGroups);
  const localByName = new Map((Array.isArray(localGroups) ? localGroups : []).map((group) => [group.name, group]));
  return combined.map((group) => {
    const local = localByName.get(group.name);
    if (!local?.tags) return group;
    const tags = [...group.tags];
    local.tags.forEach((tag) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
    return { ...group, tags };
  });
}

function mergeLogsForSync(localLogs, remoteLogs) {
  const byId = new Map();
  [...localLogs, ...remoteLogs].forEach((log) => {
    if (!log?.id) return;
    const current = byId.get(log.id);
    if (!current || new Date(log.updatedAt || log.createdAt) >= new Date(current.updatedAt || current.createdAt)) {
      byId.set(log.id, log);
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function historyWithLogLocation(log) {
  const history = Array.isArray(log.history) ? [...log.history] : [];
  if (!log.location) return history;
  const hasLocation = history.some((item) => item?.location === log.location);
  if (hasLocation) return history;
  if (history.length) return [{ ...history[0], location: log.location }, ...history.slice(1)];
  return [{ at: log.createdAt || new Date().toISOString(), note: "장소 저장", location: log.location }];
}

function getLocationFromHistory(history) {
  if (!Array.isArray(history)) return "";
  const item = [...history].reverse().find((entry) => entry?.location);
  return item ? String(item.location || "").trim() : "";
}

function logToCloudRow(log, userId) {
  return {
    id: log.id,
    user_id: userId,
    group_name: log.group,
    tag: log.tag,
    memo: log.memo,
    created_at: log.createdAt,
    updated_at: log.updatedAt || log.createdAt,
    completed_at: log.completedAt || null,
    deleted_at: log.deletedAt || null,
    history: historyWithLogLocation(log),
  };
}

function cloudRowToLog(row) {
  return {
    id: row.id,
    group: row.group_name,
    tag: row.tag,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    completedAt: row.completed_at,
    deletedAt: row.deleted_at,
    location: getLocationFromHistory(row.history),
    history: Array.isArray(row.history) ? row.history : [],
  };
}

function mergeOrderProducts(localProducts, remoteProducts) {
  const byId = new Map();
  [...localProducts, ...remoteProducts].forEach((product) => {
    if (!product?.id) return;
    const current = byId.get(product.id);
    const productDate = new Date(product.updatedAt || product.createdAt || 0);
    const currentDate = new Date(current?.updatedAt || current?.createdAt || 0);
    if (!current || productDate >= currentDate) {
      byId.set(product.id, { ...current, ...product, imageData: product.imageData || current?.imageData });
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function mergeOrderHistory(localHistory, remoteHistory) {
  const byId = new Map();
  [...localHistory, ...remoteHistory].map(normalizeOrderHistoryEntry).forEach((entry) => {
    if (!entry?.id) return;
    const current = byId.get(entry.id);
    const entryDate = new Date(entry.createdAt || 0);
    const currentDate = new Date(current?.createdAt || 0);
    if (!current || entryDate >= currentDate) {
      byId.set(entry.id, { ...current, ...entry, pageData: entry.pageData || current?.pageData });
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function orderProductToCloudRow(product, userId) {
  return {
    id: product.id,
    user_id: userId,
    product_number: product.number,
    image_path: product.imagePath,
    fields: product.fields || {},
    created_at: product.createdAt,
    updated_at: product.updatedAt || product.createdAt,
  };
}

function cloudRowToOrderProduct(row) {
  return {
    id: row.id,
    number: row.product_number,
    imagePath: row.image_path,
    fields: row.fields || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function orderHistoryToCloudRow(entry, userId) {
  const normalized = normalizeOrderHistoryEntry(entry);
  const items = Array.isArray(normalized.items) && normalized.items.length ? normalized.items : [{}];
  const storedItems = items.map((item) => ({
    ...item,
    category: normalizeOrderCategory(item.category || normalized.category),
    deliveryStatus: normalizeOrderDeliveryStatus(item.deliveryStatus || normalized.deliveryStatus),
    deliveredAt: item.deliveredAt || normalized.deliveredAt || "",
    status: item.status || normalized.status || "발주완료",
    memo: item.memo || normalized.memo || "",
    sourceLogId: item.sourceLogId || normalized.sourceLogId || "",
  }));
  return {
    id: normalized.id,
    user_id: userId,
    type: normalized.type || "generated",
    memo: normalized.memo || "",
    product_name: normalized.productName || "",
    factory: normalized.factory || "",
    search_text:
      normalized.search ||
      [
        normalized.productName,
        normalized.factory,
        normalized.customer,
        normalized.quantity,
        normalized.category,
        normalized.deliveryStatus,
        normalized.status,
        normalized.dueDate,
        normalized.memo,
      ]
        .filter(Boolean)
        .join(" "),
    items: storedItems,
    image_paths: Array.isArray(normalized.pages) ? normalized.pages : [],
    created_at: normalized.createdAt,
  };
}

function cloudRowToOrderHistory(row) {
  return normalizeOrderHistoryEntry({
    id: row.id,
    type: row.type || "generated",
    memo: row.memo || "",
    productName: row.product_name || "",
    factory: row.factory || "",
    search: row.search_text || "",
    items: Array.isArray(row.items) ? row.items : [],
    pages: Array.isArray(row.image_paths) ? row.image_paths : [],
    createdAt: row.created_at,
  });
}

function addLog(group, tag, memo, note = "신규 입력", extra = {}) {
  const now = new Date().toISOString();
  state.logs.unshift({
    id: crypto.randomUUID(),
    group,
    tag,
    location: String(extra.location || "").trim(),
    memo,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    history: [{ at: now, note }],
  });
  persist();
  render();
}

function moveLog(log, group, tag, note) {
  const now = new Date().toISOString();
  return {
    ...log,
    group,
    tag,
    location: isTripGroup(group) ? log.location || state.selectedTripLocation || state.tripLocations[0] : log.location || "",
    updatedAt: now,
    history: [...(log.history || []), { at: now, note: `${note}: ${log.group} / ${log.tag} → ${group} / ${tag}` }],
  };
}

function completeLog(id, note) {
  const now = new Date().toISOString();
  state.logs = state.logs.map((log) => {
    if (log.id !== id) return log;
    return {
      ...log,
      completedAt: now,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note }],
    };
  });
  state.selectedIds.delete(id);
  persist();
  render();
  showToast("완료목록으로 이동했습니다.");
}

function reopenLogs(ids) {
  const reopenIds = new Set(ids);
  const now = new Date().toISOString();
  let count = 0;
  state.logs = state.logs.map((log) => {
    if (!reopenIds.has(log.id) || !log.completedAt || log.deletedAt) return log;
    count += 1;
    const { completedAt, ...reopened } = log;
    return {
      ...reopened,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note: "완료 취소 → 진행중" }],
    };
  });
  reopenIds.forEach((id) => state.selectedIds.delete(id));
  persist();
  render();
  return count;
}

function openDeleteModal(ids) {
  const targets = ids.map(getLogById).filter(Boolean);
  if (!targets.length) return;

  state.pendingDeleteIds = targets.map((log) => log.id);
  els.deleteSummary.textContent =
    targets.length === 1 ? "이 기록을 휴지통으로 이동할까요?" : `${targets.length}건을 휴지통으로 이동할까요?`;
  els.deletePreview.textContent = formatDeletePreview(targets);
  els.deleteModal.showModal();
}

function moveLogsToTrash(ids) {
  const deleteIds = new Set(ids);
  const now = new Date().toISOString();
  let count = 0;
  state.logs = state.logs.map((log) => {
    if (!deleteIds.has(log.id) || log.deletedAt) return log;
    count += 1;
    return {
      ...log,
      deletedAt: now,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note: "휴지통으로 이동" }],
    };
  });
  deleteIds.forEach((id) => state.selectedIds.delete(id));
  persist();
  render();
  return count;
}

function restoreLogs(ids) {
  const restoreIds = new Set(ids);
  const now = new Date().toISOString();
  let count = 0;
  state.logs = state.logs.map((log) => {
    if (!restoreIds.has(log.id) || !log.deletedAt) return log;
    count += 1;
    const { deletedAt, ...restored } = log;
    return {
      ...restored,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note: "휴지통에서 복원" }],
    };
  });
  restoreIds.forEach((id) => state.selectedIds.delete(id));
  persist();
  render();
  return count;
}

function emptyTrash() {
  const before = state.logs.length;
  const deletedIds = state.logs.filter((log) => log.deletedAt).map((log) => log.id);
  state.logs = state.logs.filter((log) => !log.deletedAt);
  state.selectedIds.clear();
  persist();
  deleteCloudLogs(deletedIds);
  render();
  return before - state.logs.length;
}

function formatDeletePreview(logs) {
  const preview = logs
    .slice(0, 3)
    .map((log) => `[${log.group} / ${log.tag}] ${log.memo}`)
    .join("\n\n");
  return logs.length > 3 ? `${preview}\n\n외 ${logs.length - 3}건` : preview;
}

function handleShipAction(action) {
  els.shipModal.close();
  const count = processStoreShipLogs([els.shipLogId.value], action);
  if (count) showToast(`${STORE_SHIP_ACTION_LABELS[action] || "출고 처리"} 처리했습니다.`);
}

function processStoreShipLogs(ids, action) {
  const idSet = new Set(ids);
  const targets = state.logs.filter((log) => idSet.has(log.id) && isActiveStoreShipmentLog(log));
  if (!targets.length) return 0;

  const now = new Date().toISOString();
  const tasks = getStoreShipTasks(action);
  const sourceIds = new Set(targets.map((log) => log.id));
  const officeLogs = [];

  targets.forEach((source) => {
    tasks.forEach(([group, tag]) => {
      officeLogs.push({
        id: crypto.randomUUID(),
        group,
        tag,
        location: "",
        memo: source.memo,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        history: [{ at: now, note: "매장 / 출고에서 자동 생성" }],
      });
    });
  });

  const note = tasks.length ? "출고 후 사무실 업무 생성" : "출고 완료";
  state.logs = state.logs.map((log) => {
    if (!sourceIds.has(log.id)) return log;
    return {
      ...log,
      completedAt: now,
      updatedAt: now,
      history: [...(log.history || []), { at: now, note }],
    };
  });
  state.logs = [...officeLogs, ...state.logs];
  targets.forEach((log) => state.selectedIds.delete(log.id));
  persist();
  render();
  return targets.length;
}

function isActiveStoreShipmentLog(log) {
  return Boolean(log && log.group === "매장" && log.tag === "출고" && !log.completedAt && !log.deletedAt);
}

function getStoreShipTasks(action) {
  return (
    {
      statement: [["사무실", "명세서"]],
      "statement-tax": [
        ["사무실", "명세서"],
        ["사무실", "세금계산서"],
      ],
      tax: [["사무실", "세금계산서"]],
      complete: [],
    }[action] || []
  );
}

function openMoveModal(id) {
  const log = getLogById(id);
  if (!log) return;
  els.moveLogId.value = id;
  renderTargetOptions(els.moveTarget);
  els.moveTarget.value = targetValue(log.group, log.tag);
  els.moveModal.showModal();
}

function openShipModal(id) {
  els.shipLogId.value = id;
  els.shipModal.showModal();
}

function openFeedbackModal(id) {
  els.feedbackLogId.value = id;
  els.feedbackMemo.value = "";
  els.feedbackModal.showModal();
}

function renameTag(groupName, oldTag, newTag) {
  if (!newTag || newTag === oldTag) {
    renderSettings();
    return;
  }
  const group = getGroup(groupName);
  if (group.tags.includes(newTag)) {
    showToast("이미 있는 태그입니다.");
    renderSettings();
    return;
  }
  group.tags = group.tags.map((tag) => (tag === oldTag ? newTag : tag));
  state.logs = state.logs.map((log) => {
    if (log.group !== groupName || log.tag !== oldTag) return log;
    return moveLog(log, groupName, newTag, "태그 이름 수정");
  });
  if (state.selectedGroup === groupName && state.selectedTag === oldTag) state.selectedTag = newTag;
  persist();
  render();
  showToast("태그를 수정했습니다.");
}

function addTag(groupName, tag) {
  if (!tag) return;
  const group = getGroup(groupName);
  if (group.tags.includes(tag)) {
    showToast("이미 있는 태그입니다.");
    return;
  }
  group.tags.push(tag);
  persist();
  render();
  showToast("태그를 추가했습니다.");
}

function openTagDeleteModal(groupName, tag) {
  const group = getGroup(groupName);
  if (!group || !group.tags.includes(tag)) return;
  if (group.tags.length <= 1) {
    showToast("그룹에는 태그가 최소 1개 필요합니다.");
    return;
  }

  const relatedLogs = state.logs.filter((log) => log.group === groupName && log.tag === tag);
  const targetTags = group.tags.filter((item) => item !== tag);
  state.pendingTagDelete = {
    groupName,
    tag,
    count: relatedLogs.length,
  };

  els.tagDeleteSummary.textContent =
    relatedLogs.length > 0
      ? `${groupName} / ${tag} 태그에 기존 로그 ${relatedLogs.length}건이 있습니다. 기록은 삭제되지 않습니다.`
      : `${groupName} / ${tag} 태그를 삭제할까요? 이 태그로 등록된 로그는 없습니다.`;
  els.tagDeleteMoveArea.hidden = relatedLogs.length === 0 || targetTags.length === 0;
  els.tagDeleteTarget.replaceChildren(...targetTags.map((targetTag) => option(targetTag, targetTag)));
  els.deleteTagMoveBtn.hidden = relatedLogs.length === 0 || targetTags.length === 0;
  els.deleteTagMoveBtn.disabled = relatedLogs.length > 0 && targetTags.length === 0;
  els.deleteTagKeepBtn.textContent = relatedLogs.length > 0 ? "태그만 삭제" : "삭제";
  els.tagDeleteNote.textContent =
    relatedLogs.length > 0
      ? "이동 후 삭제를 선택하면 기존 로그의 태그가 선택한 태그로 바뀝니다. 태그만 삭제를 선택하면 기존 로그 표시는 그대로 두고 앞으로 선택 목록에서만 사라집니다."
      : "삭제한 태그는 앞으로 로그 작성 화면에서 선택되지 않습니다.";
  els.tagDeleteModal.showModal();
}

function deletePendingTag(options = {}) {
  const pending = state.pendingTagDelete;
  if (!pending) return;
  const group = getGroup(pending.groupName);
  if (!group || !group.tags.includes(pending.tag)) {
    els.tagDeleteModal.close();
    state.pendingTagDelete = null;
    return;
  }
  if (group.tags.length <= 1) {
    showToast("그룹에는 태그가 최소 1개 필요합니다.");
    return;
  }

  const now = new Date().toISOString();
  const targetTag = els.tagDeleteTarget.value;
  let movedCount = 0;
  if (options.moveLogs) {
    if (!targetTag || targetTag === pending.tag) {
      showToast("기존 로그를 옮길 태그를 선택하세요.");
      return;
    }
    state.logs = state.logs.map((log) => {
      if (log.group !== pending.groupName || log.tag !== pending.tag) return log;
      movedCount += 1;
      return {
        ...log,
        tag: targetTag,
        updatedAt: now,
        history: [...(log.history || []), { at: now, note: `태그 삭제 전 이동: ${pending.tag} → ${targetTag}` }],
      };
    });
  }

  group.tags = group.tags.filter((tag) => tag !== pending.tag);
  if (state.selectedGroup === pending.groupName && state.selectedTag === pending.tag) state.selectedTag = group.tags[0];
  if (state.tagFilter === tagFilterValue(pending.groupName, pending.tag)) state.tagFilter = "";
  state.selectedIds.clear();
  state.pendingTagDelete = null;
  persist();
  els.tagDeleteModal.close();
  render();
  showToast(options.moveLogs ? `${movedCount}건을 옮기고 태그를 삭제했습니다.` : "태그를 삭제했습니다.");
}

function reorderTag(groupName, from, to) {
  const group = getGroup(groupName);
  if (to < 0 || to >= group.tags.length) return;
  const [tag] = group.tags.splice(from, 1);
  group.tags.splice(to, 0, tag);
  persist();
  render();
}

function addTripLocationFromInput() {
  const location = els.newTripLocationInput.value.trim();
  if (!location) return;
  if (state.tripLocations.includes(location)) {
    showToast("이미 있는 장소입니다.");
    return;
  }
  state.tripLocations.push(location);
  state.selectedTripLocation = location;
  persist();
  render();
  showToast("장소를 추가했습니다.");
}

function renameTripLocation(oldLocation, newLocation) {
  if (!newLocation || newLocation === oldLocation) {
    renderTripLocationSettings();
    return;
  }
  if (state.tripLocations.includes(newLocation)) {
    showToast("이미 있는 장소입니다.");
    renderTripLocationSettings();
    return;
  }
  state.tripLocations = state.tripLocations.map((location) => (location === oldLocation ? newLocation : location));
  state.logs = state.logs.map((log) => {
    if (log.location !== oldLocation) return log;
    return { ...log, location: newLocation, updatedAt: new Date().toISOString() };
  });
  if (state.selectedTripLocation === oldLocation) state.selectedTripLocation = newLocation;
  if (state.locationFilter === oldLocation) state.locationFilter = newLocation;
  persist();
  render();
  showToast("장소 이름을 수정했습니다.");
}

function removeTripLocation(location) {
  if (state.tripLocations.length <= 1) {
    showToast("장소는 최소 1개가 필요합니다.");
    return;
  }
  state.tripLocations = state.tripLocations.filter((item) => item !== location);
  if (state.selectedTripLocation === location) state.selectedTripLocation = state.tripLocations[0];
  if (state.locationFilter === location) state.locationFilter = "";
  persist();
  render();
  showToast("장소를 삭제했습니다.");
}

function reorderTripLocation(from, to, options = {}) {
  state.tripLocations = mergeTripLocations(state.tripLocations);
  if (from < 0 || to < 0 || from >= state.tripLocations.length || to >= state.tripLocations.length || from === to) {
    return false;
  }
  const [location] = state.tripLocations.splice(from, 1);
  state.tripLocations.splice(to, 0, location);
  if (options.persist === false) {
    renderTripLocationSettings();
    renderTripLocationPicker();
    return true;
  }
  persist();
  render();
  showToast("장소 순서를 바꿨습니다.");
  return true;
}

function reorderTripLocationByTarget(dragLocation, targetLocation) {
  const from = state.tripLocations.indexOf(dragLocation);
  const to = state.tripLocations.indexOf(targetLocation);
  if (reorderTripLocation(from, to, { persist: false })) {
    state.tripLocationDragMoved = true;
  }
}

function startTripLocationDrag(event, location) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  state.draggingTripLocation = location;
  state.tripLocationDragMoved = false;
  document.body.classList.add("is-dragging-trip-location");
  document.addEventListener("pointermove", handleTripLocationDragMove);
  document.addEventListener("pointerup", finishTripLocationDrag, { once: true });
  document.addEventListener("pointercancel", finishTripLocationDrag, { once: true });
  renderTripLocationSettings();
}

function handleTripLocationDragMove(event) {
  if (!state.draggingTripLocation) return;
  event.preventDefault();
  const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest(".trip-location-row");
  const targetLocation = targetRow?.dataset.location;
  if (!targetLocation || targetLocation === state.draggingTripLocation) return;
  reorderTripLocationByTarget(state.draggingTripLocation, targetLocation);
}

function finishTripLocationDrag() {
  document.removeEventListener("pointermove", handleTripLocationDragMove);
  document.body.classList.remove("is-dragging-trip-location");
  const moved = state.tripLocationDragMoved;
  state.draggingTripLocation = "";
  state.tripLocationDragMoved = false;
  if (moved) {
    persist();
    render();
    showToast("장소 순서를 바꿨습니다.");
  } else {
    renderTripLocationSettings();
  }
}

function getFilteredLogs() {
  const query = state.search.toLocaleLowerCase("ko-KR");
  return state.logs
    .filter((log) => {
      if (state.status === "trash" && !log.deletedAt) return false;
      if (state.status !== "trash" && log.deletedAt) return false;
      if (state.status === "active" && log.completedAt) return false;
      if (state.status === "done" && !log.completedAt) return false;
      if (state.listGroupFilter && log.group !== state.listGroupFilter) return false;
      if (state.tagFilter) {
        const selected = parseTagFilter(state.tagFilter);
        if (log.group !== selected.group || log.tag !== selected.tag) return false;
      }
      if (state.locationFilter && log.location !== state.locationFilter) return false;
      if (!query) return true;
      return [log.memo, log.group, log.tag, log.location].some((value) =>
        String(value || "").toLocaleLowerCase("ko-KR").includes(query),
      );
    })
    .sort(compareLogs);
}

function compareLogs(a, b) {
  const textCompare = (left, right) => left.localeCompare(right, "ko-KR", { numeric: true, sensitivity: "base" });
  if (state.sortMode === "created-asc") return new Date(a.createdAt) - new Date(b.createdAt);
  if (state.sortMode === "title-asc") return textCompare(getLogTitle(a), getLogTitle(b));
  if (state.sortMode === "title-desc") return textCompare(getLogTitle(b), getLogTitle(a));
  if (state.sortMode === "group-asc") return textCompare(a.group, b.group) || textCompare(a.tag, b.tag);
  if (state.sortMode === "tag-asc") return textCompare(a.tag, b.tag) || textCompare(a.group, b.group);
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function getLogTitle(log) {
  return String(log.memo || "").split(/[\/\n]/)[0].trim();
}

function getGroup(groupName) {
  return state.groups.find((group) => group.name === groupName) || state.groups[0];
}

function getLogById(id) {
  return state.logs.find((log) => log.id === id);
}

function groupClass(groupName) {
  return {
    매장: "store",
    중국: "china",
    중국출장: "trip",
    사무실: "office",
  }[groupName];
}

function renderTargetOptions(select) {
  const current = select.value;
  const values = state.groups.flatMap((group) => group.tags.map((tag) => targetValue(group.name, tag)));
  select.replaceChildren(...state.groups.map(renderTargetGroup));
  select.value = values.includes(current) ? current : values[0];
}

function renderTargetGroup(group) {
  const optgroup = document.createElement("optgroup");
  optgroup.label = group.name;
  optgroup.append(...group.tags.map((tag) => option(targetValue(group.name, tag), `${group.name} / ${tag}`)));
  return optgroup;
}

function targetValue(groupName, tag) {
  return `${groupName}::${tag}`;
}

function parseTargetValue(value) {
  const [group, ...tagParts] = String(value || "").split("::");
  return { group, tag: tagParts.join("::") };
}

function option(value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  return item;
}

function pill(text, extraClass) {
  const span = document.createElement("span");
  span.className = extraClass ? `pill ${extraClass}` : "pill";
  span.textContent = text;
  return span;
}

function timeLabel(date) {
  const span = document.createElement("span");
  span.className = "time";
  span.textContent = formatDate(date);
  return span;
}

function actionButton(label, handler, important = false, variant = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.classList.toggle("important", important);
  if (variant) button.classList.add(variant);
  button.addEventListener("click", handler);
  return button;
}

function smallButton(label, handler, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", handler);
  return button;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function shareLogs(logs) {
  if (!logs.length) {
    showToast("공유할 기록이 없습니다.");
    return;
  }
  const text = formatShareText(logs);
  openShareModal(text, "업무 로그");
}

function formatShareText(logs) {
  return logs.map((log) => `[${log.group} / ${log.tag}] ${log.memo}`).join("\n\n");
}

function openShareModal(text, title = "업무 로그") {
  state.pendingShareText = text;
  state.pendingShareTitle = title;
  els.sharePreview.textContent = text;
  els.shareModal.showModal();
}

function focusOrderArea(type) {
  const targets = {
    image: els.productSearchInput || els.imageMarkBoard,
    text: els.textOrderMemoInput,
    existing: els.existingOrderImageInput,
  };
  document.querySelectorAll(".order-mode-chip").forEach((button) => button.classList.remove("is-active"));
  const activeButton =
    type === "image" ? els.imageOrderModeBtn : type === "existing" ? els.existingOrderModeBtn : els.textOrderModeBtn;
  activeButton?.classList.add("is-active");
  const target = targets[type];
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (target?.focus) window.setTimeout(() => target.focus(), 250);
}

function prepareTextOrderFromLog(log) {
  state.module = "orderImage";
  render();
  if (els.textOrderMemoInput) els.textOrderMemoInput.value = log.memo;
  if (els.textOrderSourceLogInput) els.textOrderSourceLogInput.value = log.id;
  if (els.textOrderStatusSelect) els.textOrderStatusSelect.value = "발주완료";
  focusOrderArea("text");
  showToast("중국 로그를 텍스트 발주 입력칸으로 옮겼습니다.");
}

function readTextOrderForm() {
  const memo = els.textOrderMemoInput?.value.trim() || "";
  return {
    productName: orderTextTitle(memo),
    factory: "",
    customer: "",
    quantity: "",
    price: "",
    dueDate: "",
    category: normalizeOrderCategory(els.textOrderCategorySelect?.value),
    status: els.textOrderStatusSelect?.value || "발주완료",
    memo,
    sourceLogId: els.textOrderSourceLogInput?.value || "",
  };
}

async function saveTextOrder(options = {}) {
  const values = readTextOrderForm();
  if (!values.memo) {
    showToast("발주 내용을 입력하세요.");
    return;
  }
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 발주 이력을 클라우드에 저장할 수 있습니다.");
    return;
  }

  await runCloudTask(async () => {
    const entry = createTextOrderHistoryEntry(values);
    state.orderHistory.unshift(entry);
    state.orderHistorySearch = "";
    if (values.sourceLogId) markSourceLogAsOrderRegistered(values.sourceLogId, entry.id);
    persistOrderBoard();
    await Promise.all([pushOrderBoardState({ silent: true }), values.sourceLogId ? pushCloudState({ silent: true }) : Promise.resolve()]);
    clearTextOrderForm();
    render();
    showToast("텍스트 발주를 등록했습니다.");
    if (options.share) shareTextOrderEntry(entry);
  });
}

function createTextOrderHistoryEntry(values) {
  const now = new Date().toISOString();
  const item = {
    name: values.productName,
    factory: values.factory,
    customer: values.customer,
    quantity: values.quantity,
    price: values.price,
    dueDate: values.dueDate,
    category: values.category,
    deliveryStatus: DEFAULT_ORDER_DELIVERY_STATUS,
    deliveredAt: "",
    status: values.status,
    memo: values.memo,
    sourceLogId: values.sourceLogId,
  };
  return {
    id: crypto.randomUUID(),
    type: "text",
    createdAt: now,
    productName: values.productName,
    factory: values.factory,
    customer: values.customer,
    quantity: values.quantity,
    price: values.price,
    dueDate: values.dueDate,
    category: values.category,
    deliveryStatus: DEFAULT_ORDER_DELIVERY_STATUS,
    deliveredAt: "",
    status: values.status,
    memo: values.memo,
    search: [values.productName, values.category, DEFAULT_ORDER_DELIVERY_STATUS, values.status, values.memo].filter(Boolean).join(" "),
    sourceLogId: values.sourceLogId,
    pages: [],
    pageData: [],
    items: [item],
  };
}

function markSourceLogAsOrderRegistered(logId, orderId) {
  const now = new Date().toISOString();
  state.logs = state.logs.map((log) =>
    log.id === logId
      ? {
          ...log,
          updatedAt: now,
          completedAt: log.completedAt || now,
          history: [...(log.history || []), { at: now, note: `발주 관리로 등록 (${orderId.slice(0, 8)})` }],
        }
      : log,
  );
  persist({ skipCloud: true });
}

function clearTextOrderForm() {
  [
    els.textOrderMemoInput,
    els.textOrderSourceLogInput,
  ].forEach((input) => {
    if (input) input.value = "";
  });
  if (els.textOrderStatusSelect) els.textOrderStatusSelect.value = "발주완료";
}

function shareTextOrderEntry(entry, options = {}) {
  if (entry?.id && options.markDelivered !== false) {
    updateTextOrderDeliveryStatus(entry.id, "전달완료", { silent: true });
  }
  openShareModal(formatTextOrderShare(entry), "텍스트 발주");
}

function formatTextOrderShare(entry) {
  return entry.memo || getPrimaryOrderItem(entry).memo || entry.productName || "텍스트 발주";
}

function getPrimaryOrderItem(entry) {
  return Array.isArray(entry?.items) ? entry.items[0] || {} : {};
}

function orderTextTitle(text) {
  const firstLine = String(text || "")
    .split(/\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return "텍스트 발주";
  return firstLine.length > 48 ? `${firstLine.slice(0, 47)}...` : firstLine;
}

async function shareToKakao() {
  showToast("공유창에서 카카오톡을 선택하세요.");
  await shareBySystem();
}

function shareToSms() {
  const text = state.pendingShareText;
  if (!text) return;
  const separator = /iPad|iPhone|iPod/i.test(navigator.userAgent) ? "&" : "?";
  window.location.href = `sms:${separator}body=${encodeURIComponent(text)}`;
  els.shareModal.close();
}

async function shareBySystem() {
  const text = state.pendingShareText;
  if (!text) return;
  if (navigator.share) {
    try {
      await navigator.share({ title: state.pendingShareTitle || "업무 로그", text });
      els.shareModal.close();
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  await copyShareText();
}

async function copyShareText() {
  const text = state.pendingShareText;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("공유 내용이 복사되었습니다.");
    els.shareModal.close();
  } catch {
    downloadBlob("ops-share.txt", text, "text/plain;charset=utf-8");
    els.shareModal.close();
  }
}

function renderOrderBoard() {
  ensureOrderElements();
  if (!els.orderImageCounts) return;
  els.orderImageCounts.replaceChildren(
    countPill(`상품 ${state.orderProducts.length}`),
    countPill(`바구니 ${state.orderCart.length}`),
    countPill(`텍스트 ${state.orderHistory.filter((entry) => entry.type === "text").length}`),
    countPill(`이력 ${state.orderHistory.length}`),
  );
  if (els.productSearchInput && document.activeElement !== els.productSearchInput) {
    els.productSearchInput.value = state.orderSearch;
  }
  if (els.orderHistorySearchInput && document.activeElement !== els.orderHistorySearchInput) {
    els.orderHistorySearchInput.value = state.orderHistorySearch;
  }
  renderProductFields();
  renderProductList();
  renderOrderEditor();
  renderOrderCart();
  renderGeneratedOrderPages();
  renderOrderHistory();
}

function renderProductFields() {
  els.productFieldList.replaceChildren(
    ...state.orderFields.map((field, index) => {
      const row = document.createElement("div");
      row.className = "field-row";
      const input = document.createElement("input");
      input.value = field.label;
      input.addEventListener("change", () => {
        field.label = input.value.trim() || field.label;
        persistOrderBoard();
        renderOrderBoard();
      });

      const actions = document.createElement("div");
      actions.className = "field-row-actions";
      const up = orderSmallButton("↑", () => moveOrderField(index, -1));
      const down = orderSmallButton("↓", () => moveOrderField(index, 1));
      const remove = orderSmallButton("삭제", () => removeOrderField(field.id));
      up.disabled = index === 0;
      down.disabled = index === state.orderFields.length - 1;
      actions.append(up, down, remove);
      row.append(input, actions);
      return row;
    }),
  );
}

function renderProductList() {
  const products = getFilteredOrderProducts();
  if (!products.length) {
    els.productList.replaceChildren(emptyText(state.orderProducts.length ? "검색 결과가 없습니다." : "등록된 상품이 없습니다."));
    return;
  }

  els.productList.replaceChildren(
    ...products.map((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.classList.toggle("is-selected", product.id === state.selectedOrderProductId);

      const image = document.createElement("img");
      image.className = "product-thumb";
      image.alt = productFieldValue(product, "name") || product.number;
      setOrderImageElement(image, product);

      const head = document.createElement("div");
      const number = document.createElement("div");
      number.className = "product-number";
      number.textContent = product.number;
      const title = document.createElement("strong");
      title.textContent = productFieldValue(product, "name") || "상품명 없음";
      const factory = document.createElement("p");
      factory.className = "panel-copy";
      factory.textContent = productFieldValue(product, "factory") || "공장명 없음";
      head.append(number, title, factory);

      const selected = product.id === state.selectedOrderProductId;
      const actions = document.createElement("div");
      actions.className = "product-card-actions";
      actions.append(
        orderActionButton(selected ? "선택됨" : "발주 선택", selected ? "plain-action compact" : "primary-action compact", () =>
          selectOrderProduct(product.id),
        ),
        orderActionButton("삭제", "danger-action compact", () => removeOrderProduct(product.id)),
      );

      const fields = document.createElement("div");
      fields.className = "product-fields";
      state.orderFields.forEach((field) => {
        const label = document.createElement("label");
        const span = document.createElement("span");
        span.textContent = field.label;
        const input = document.createElement("input");
        input.value = product.fields?.[field.id] || "";
        input.addEventListener("change", () => {
          product.fields = { ...(product.fields || {}), [field.id]: input.value.trim() };
          product.updatedAt = new Date().toISOString();
          persistOrderBoard();
          pushOrderBoardState({ silent: true }).catch(() => {});
          renderOrderBoard();
        });
        label.append(span, input);
        fields.append(label);
      });

      const details = document.createElement("details");
      details.className = "product-details";
      const summary = document.createElement("summary");
      summary.textContent = "상품 정보 수정";
      details.append(summary, fields);

      card.append(image, head, actions, details);
      return card;
    }),
  );
}

function renderOrderEditor() {
  const product = selectedOrderProduct();
  els.addToCartBtn.disabled = !product;
  els.clearMarkersBtn.disabled = !product || !state.orderMarkers.length;
  els.emptyBoardHint.hidden = Boolean(product);
  els.orderEditImage.hidden = !product;
  els.markerLayer.replaceChildren();
  if (!product) {
    els.orderEditImage.removeAttribute("src");
    els.orderEditorStatus.textContent = "상품을 선택하면 이미지 위를 터치해서 동그라미를 표시할 수 있습니다.";
    return;
  }

  els.orderEditorStatus.textContent = `${product.number} · ${productFieldValue(product, "name") || "상품"} · 동그라미 ${state.orderMarkers.length}개`;
  setOrderImageElement(els.orderEditImage, product);
  state.orderMarkers.forEach((marker, index) => {
    const button = document.createElement("button");
    button.className = "order-marker";
    button.type = "button";
    button.textContent = index + 1;
    button.style.left = `${marker.x * 100}%`;
    button.style.top = `${marker.y * 100}%`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.orderMarkers.splice(index, 1);
      renderOrderEditor();
    });
    els.markerLayer.append(button);
  });
}

function renderOrderCart() {
  if (!state.orderCart.length) {
    els.orderCartList.replaceChildren(emptyText("발주 바구니가 비어 있습니다."));
    return;
  }
  els.orderCartList.replaceChildren(
    ...state.orderCart.map((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const img = document.createElement("img");
      img.className = "cart-thumb";
      img.alt = item.name || item.number;
      setOrderImageElement(img, item);
      const info = document.createElement("div");
      info.innerHTML = `<strong>${escapeHtml(item.number)} · ${escapeHtml(item.name || "상품")}</strong><p class="panel-copy">${escapeHtml(item.factory || "공장명 없음")} · 동그라미 ${item.markers.length}개</p>`;
      row.append(img, info, orderActionButton("삭제", "danger-action compact", () => removeCartItem(item.id)));
      return row;
    }),
  );
}

function renderGeneratedOrderPages() {
  if (!state.generatedOrderPages.length) {
    els.generatedOrderPages.replaceChildren();
    return;
  }
  els.generatedOrderPages.replaceChildren(
    ...state.generatedOrderPages.map((page, index) => {
      const card = document.createElement("div");
      card.className = "generated-page";
      const img = document.createElement("img");
      img.src = page.dataUrl;
      img.alt = `발주 이미지 ${index + 1}`;
      const actions = document.createElement("div");
      actions.className = "generated-actions";
      actions.append(
        orderActionButton("공유", "primary-action compact", () => shareOrderPage(index)),
        orderActionButton("저장", "plain-action", () => downloadDataUrl(`order-page-${index + 1}-${dateStamp()}.jpg`, page.dataUrl)),
      );
      card.append(img, actions);
      return card;
    }),
  );
}

function renderOrderHistory() {
  if (!state.orderHistory.length) {
    state.selectedOrderHistoryIds.clear();
    els.orderHistoryList.replaceChildren(emptyText("저장된 발주 이력이 없습니다."));
    return;
  }
  const filteredEntries = getFilteredOrderHistory();
  const visibleEntries = filteredEntries.slice(0, 30);
  state.selectedOrderHistoryIds.forEach((id) => {
    if (!visibleEntries.some((entry) => entry.id === id)) state.selectedOrderHistoryIds.delete(id);
  });
  if (!visibleEntries.length) {
    state.selectedOrderHistoryIds.clear();
    els.orderHistoryList.replaceChildren(emptyText("발주 검색 결과가 없습니다."));
    return;
  }
  els.orderHistoryList.replaceChildren(
    renderOrderHistoryBatchBar(visibleEntries),
    ...visibleEntries.map((entry) => {
      const row = document.createElement("div");
      row.className = "history-row";
      row.dataset.type = entry.type || "";
      row.classList.toggle("is-selected", state.selectedOrderHistoryIds.has(entry.id));

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.selectedOrderHistoryIds.has(entry.id);
      checkbox.setAttribute("aria-label", "발주 이력 선택");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) state.selectedOrderHistoryIds.add(entry.id);
        else state.selectedOrderHistoryIds.delete(entry.id);
        renderOrderHistory();
      });

      const thumb = createOrderHistoryThumb(entry);
      if (thumb) row.classList.add("has-thumb");
      const info = document.createElement("div");
      info.className = "history-info";

      const titleLine = document.createElement("div");
      titleLine.className = "history-title-line";
      const title = document.createElement("strong");
      title.textContent = orderHistoryTitle(entry);
      titleLine.append(title, createOrderCategoryBadge(entry), createOrderDeliveryBadge(entry), createOrderTypeBadge(entry));

      const meta = document.createElement("p");
      meta.className = "panel-copy";
      meta.textContent = orderHistoryMeta(entry);
      info.append(titleLine, meta);

      const actions = document.createElement("div");
      actions.className = "history-actions";
      if (entry.type === "text") actions.append(createOrderDeliverySelect(entry));
      actions.append(
        createOrderCategorySelect(entry),
        createOrderStatusSelect(entry),
        orderActionButton("공유", "plain-action", () => shareHistoryEntry(entry.id)),
      );

      row.append(checkbox);
      if (thumb) row.append(thumb);
      row.append(info, actions);
      return row;
    }),
  );
}

function getFilteredOrderHistory() {
  const tokens = state.orderHistorySearch
    .trim()
    .toLocaleLowerCase("ko-KR")
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return state.orderHistory;
  return state.orderHistory.filter((entry) => {
    const haystack = orderHistorySearchText(entry).toLocaleLowerCase("ko-KR");
    return tokens.every((token) => haystack.includes(token));
  });
}

function orderHistorySearchText(entry) {
  const items = Array.isArray(entry.items) ? entry.items : [];
  const itemText = items
    .map((item) =>
      [
        item.number,
        item.name,
        item.factory,
        item.customer,
        item.quantity,
        item.price,
        item.dueDate,
        item.status,
        item.category,
        item.deliveryStatus,
        item.deliveredAt,
        item.memo,
        ...(item.fields ? Object.values(item.fields) : []),
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ");
  return [
    entry.type === "text" ? "텍스트 발주" : entry.type === "external" ? "기존 이미지" : "이미지 발주",
    entry.productName,
    entry.factory,
    entry.customer,
    entry.quantity,
    entry.price,
    entry.dueDate,
    entry.status,
    entry.category,
    entry.deliveryStatus,
    entry.deliveredAt,
    entry.search,
    entry.memo,
    itemText,
  ]
    .filter(Boolean)
    .join(" ");
}

function renderOrderHistoryBatchBar(entries) {
  const selectedCount = state.selectedOrderHistoryIds.size;
  const bar = document.createElement("div");
  bar.className = "order-history-batch";

  const summary = document.createElement("strong");
  summary.textContent = `${selectedCount}건 선택`;

  const selectAll = orderActionButton(selectedCount ? "선택해제" : "전체선택", "plain-action", () => {
    if (state.selectedOrderHistoryIds.size) state.selectedOrderHistoryIds.clear();
    else entries.forEach((entry) => state.selectedOrderHistoryIds.add(entry.id));
    renderOrderHistory();
  });

  const statusSelect = document.createElement("select");
  statusSelect.setAttribute("aria-label", "일괄 변경 상태");
  ORDER_STATUS_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusSelect.append(option);
  });
  statusSelect.value = "선적완료";
  statusSelect.disabled = selectedCount === 0;

  const apply = orderActionButton("일괄 상태 변경", "primary-action compact", () => {
    updateOrderHistoryStatus([...state.selectedOrderHistoryIds], statusSelect.value, { clearSelection: true });
  });
  apply.disabled = selectedCount === 0;

  const categorySelect = document.createElement("select");
  categorySelect.setAttribute("aria-label", "일괄 변경 발주 구분");
  ORDER_CATEGORY_OPTIONS.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
  categorySelect.value = DEFAULT_ORDER_CATEGORY;
  categorySelect.disabled = selectedCount === 0;

  const applyCategory = orderActionButton("일괄 구분 변경", "primary-action compact", () => {
    updateOrderHistoryCategory([...state.selectedOrderHistoryIds], categorySelect.value, { clearSelection: true });
  });
  applyCategory.disabled = selectedCount === 0;

  bar.append(summary, selectAll, categorySelect, applyCategory, statusSelect, apply);
  return bar;
}

function createOrderStatusSelect(entry) {
  const select = document.createElement("select");
  select.className = "history-status-select";
  select.setAttribute("aria-label", "발주 진행상황");
  ORDER_STATUS_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.append(option);
  });
  select.value = entry.status || getPrimaryOrderItem(entry).status || "발주완료";
  select.addEventListener("change", () => {
    updateOrderHistoryStatus([entry.id], select.value);
  });
  return select;
}

function createOrderCategorySelect(entry) {
  const select = document.createElement("select");
  select.className = "history-category-select";
  select.setAttribute("aria-label", "발주 구분");
  ORDER_CATEGORY_OPTIONS.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });
  select.value = normalizeOrderCategory(entry.category);
  select.addEventListener("change", () => {
    updateOrderHistoryCategory([entry.id], select.value);
  });
  return select;
}

function updateOrderHistoryStatus(entryIds, status, options = {}) {
  const ids = new Set(entryIds);
  if (!ids.size || !ORDER_STATUS_OPTIONS.includes(status)) return;
  const now = new Date().toISOString();
  let changed = 0;
  state.orderHistory = state.orderHistory.map((entry) => {
    if (!ids.has(entry.id)) return entry;
    changed += 1;
    const items = Array.isArray(entry.items) && entry.items.length ? entry.items : [{}];
    return {
      ...entry,
      status,
      updatedAt: now,
      items: items.map((item) => ({ ...item, status })),
    };
  });
  if (!changed) return;
  if (options.clearSelection) state.selectedOrderHistoryIds.clear();
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  showToast(`${changed}건을 ${status}(으)로 변경했습니다.`);
}

function updateOrderHistoryCategory(entryIds, category, options = {}) {
  const normalizedCategory = normalizeOrderCategory(category);
  const ids = new Set(entryIds);
  if (!ids.size) return;
  const now = new Date().toISOString();
  let changed = 0;
  state.orderHistory = state.orderHistory.map((entry) => {
    if (!ids.has(entry.id)) return entry;
    changed += 1;
    const items = Array.isArray(entry.items) && entry.items.length ? entry.items : [{}];
    return {
      ...entry,
      category: normalizedCategory,
      updatedAt: now,
      items: items.map((item) => ({ ...item, category: normalizedCategory })),
    };
  });
  if (!changed) return;
  if (options.clearSelection) state.selectedOrderHistoryIds.clear();
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  showToast(`${changed}건을 ${normalizedCategory}(으)로 변경했습니다.`);
}

function createOrderDeliverySelect(entry) {
  const select = document.createElement("select");
  select.className = "history-delivery-select";
  select.setAttribute("aria-label", "텍스트 발주 전달여부");
  ORDER_DELIVERY_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.append(option);
  });
  select.value = normalizeOrderDeliveryStatus(entry.deliveryStatus);
  select.addEventListener("change", () => {
    updateTextOrderDeliveryStatus(entry.id, select.value);
  });
  return select;
}

function updateTextOrderDeliveryStatus(entryId, status, options = {}) {
  const normalizedStatus = normalizeOrderDeliveryStatus(status);
  const now = new Date().toISOString();
  let changed = false;
  state.orderHistory = state.orderHistory.map((entry) => {
    if (entry.id !== entryId || entry.type !== "text") return entry;
    changed = true;
    const deliveredAt = normalizedStatus === "전달완료" ? entry.deliveredAt || now : "";
    const items = Array.isArray(entry.items) && entry.items.length ? entry.items : [{}];
    return {
      ...entry,
      deliveryStatus: normalizedStatus,
      deliveredAt,
      updatedAt: now,
      items: items.map((item) => ({ ...item, deliveryStatus: normalizedStatus, deliveredAt })),
    };
  });
  if (!changed) return;
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  if (!options.silent) showToast(`텍스트 발주를 ${normalizedStatus}(으)로 표시했습니다.`);
}

function createOrderHistoryThumb(entry) {
  if (entry.type === "text") return null;
  if (entry.pages?.[0]) {
    const img = document.createElement("img");
    img.className = "history-thumb";
    img.alt = entry.memo || "발주 이력";
    setOrderImageElement(img, { imagePath: entry.pages[0], imageData: entry.pageData?.[0] });
    return img;
  }
  const badge = document.createElement("div");
  badge.className = "history-thumb history-thumb-badge";
  badge.textContent = entry.type === "text" ? "TEXT" : "IMG";
  return badge;
}

function createOrderTypeBadge(entry) {
  const badge = document.createElement("span");
  badge.className = "history-type-badge";
  badge.textContent = entry.type === "text" ? "텍스트" : entry.type === "external" ? "기존 이미지" : "이미지";
  return badge;
}

function createOrderCategoryBadge(entry) {
  const badge = document.createElement("span");
  badge.className = "history-category-badge";
  badge.textContent = normalizeOrderCategory(entry.category);
  return badge;
}

function createOrderDeliveryBadge(entry) {
  if (entry.type !== "text") return document.createDocumentFragment();
  const status = normalizeOrderDeliveryStatus(entry.deliveryStatus);
  const badge = document.createElement("span");
  badge.className = "history-delivery-badge";
  badge.dataset.status = status;
  badge.textContent = status;
  return badge;
}

function orderHistoryTitle(entry) {
  if (entry.type === "text") return entry.productName || entry.memo || "텍스트 발주";
  const names = entry.items?.map((item) => item.name || item.number).filter(Boolean).slice(0, 3).join(", ");
  return names || entry.productName || "기존 발주 이미지";
}

function orderHistoryMeta(entry) {
  const item = getPrimaryOrderItem(entry);
  const dueDate = entry.dueDate || item.dueDate;
  return [
    formatDate(entry.createdAt),
    entry.type === "text" ? normalizeOrderDeliveryStatus(entry.deliveryStatus) : "",
    entry.status || item.status,
    entry.factory || item.factory,
    entry.customer || item.customer,
    entry.quantity || item.quantity,
    dueDate ? `납기 ${dueDate}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

async function handleProductImageUpload(event) {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length) return;
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 이미지를 클라우드에 저장할 수 있습니다.");
    return;
  }
  await runCloudTask(async () => {
    for (const file of files) {
      const image = await compressImageFile(file);
      const imagePath = await uploadOrderImageBlob(image.blob, "products");
      const product = {
        id: crypto.randomUUID(),
        number: nextProductNumber(),
        imagePath,
        imageData: image.dataUrl,
        fields: bulkFieldValues(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.orderProducts.unshift(product);
    }
    persistOrderBoard();
    await pushOrderBoardState({ silent: true });
    renderOrderBoard();
    showToast(`${files.length}개 상품 이미지를 등록했습니다.`);
  });
}

function applyBulkToProducts() {
  const values = bulkFieldValues();
  const entries = Object.entries(values).filter(([, value]) => value);
  if (!entries.length) {
    showToast("전체 적용할 내용을 입력하세요.");
    return;
  }
  const targets = getFilteredOrderProducts();
  targets.forEach((product) => {
    product.fields = { ...(product.fields || {}) };
    entries.forEach(([key, value]) => {
      product.fields[key] = value;
    });
    product.updatedAt = new Date().toISOString();
  });
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
  showToast(`${targets.length}개 상품에 전체 적용했습니다.`);
}

function clearBulkInputs() {
  [els.bulkProductName, els.bulkFactory, els.bulkPrice, els.bulkMoq, els.bulkSearch, els.bulkMemo].forEach((input) => {
    input.value = "";
  });
}

function bulkFieldValues() {
  return {
    name: els.bulkProductName.value.trim(),
    factory: els.bulkFactory.value.trim(),
    price: els.bulkPrice.value.trim(),
    moq: els.bulkMoq.value.trim(),
    alias: els.bulkSearch.value.trim(),
    memo: els.bulkMemo.value.trim(),
  };
}

function addProductField() {
  const label = els.newFieldNameInput.value.trim();
  if (!label) return;
  state.orderFields.push({ id: `custom_${Date.now()}`, label });
  els.newFieldNameInput.value = "";
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function moveOrderField(index, direction) {
  const next = index + direction;
  if (next < 0 || next >= state.orderFields.length) return;
  const [field] = state.orderFields.splice(index, 1);
  state.orderFields.splice(next, 0, field);
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function removeOrderField(fieldId) {
  if (!confirm("이 항목을 삭제할까요? 기존 상품의 값은 숨겨집니다.")) return;
  state.orderFields = state.orderFields.filter((field) => field.id !== fieldId);
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function getFilteredOrderProducts() {
  const keyword = state.orderSearch.trim().toLowerCase();
  if (!keyword) return state.orderProducts;
  return state.orderProducts.filter((product) => {
    const haystack = [product.number, ...Object.values(product.fields || {})].join(" ").toLowerCase();
    return haystack.includes(keyword);
  });
}

function selectOrderProduct(productId) {
  state.selectedOrderProductId = productId;
  state.orderMarkers = [];
  renderOrderBoard();
  const product = selectedOrderProduct();
  showToast(`${product?.number || "상품"}을 선택했습니다. 이미지 위에 동그라미를 표시하세요.`);
  requestAnimationFrame(() => {
    els.imageMarkBoard?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function selectedOrderProduct() {
  return state.orderProducts.find((product) => product.id === state.selectedOrderProductId);
}

function addOrderMarker(event) {
  const product = selectedOrderProduct();
  if (!product) return;
  if (event.target.closest(".order-marker")) return;
  const rect = els.imageMarkBoard.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  state.orderMarkers.push({ x, y });
  renderOrderEditor();
}

function addSelectedProductToCart() {
  const product = selectedOrderProduct();
  if (!product) return;
  state.orderCart.push({
    id: crypto.randomUUID(),
    productId: product.id,
    number: product.number,
    name: productFieldValue(product, "name"),
    factory: productFieldValue(product, "factory"),
    imagePath: product.imagePath,
    imageData: product.imageData,
    fields: { ...(product.fields || {}) },
    markers: structuredClone(state.orderMarkers),
    createdAt: new Date().toISOString(),
  });
  state.orderMarkers = [];
  persistOrderBoard();
  renderOrderBoard();
  showToast("발주 바구니에 담았습니다.");
}

function removeCartItem(itemId) {
  state.orderCart = state.orderCart.filter((item) => item.id !== itemId);
  persistOrderBoard();
  renderOrderBoard();
}

function clearOrderCart() {
  state.orderCart = [];
  state.generatedOrderPages = [];
  persistOrderBoard();
  renderOrderBoard();
}

async function generateOrderImages() {
  if (!state.orderCart.length) {
    showToast("발주 바구니가 비어 있습니다.");
    return;
  }
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 발주 이미지를 클라우드에 저장할 수 있습니다.");
    return;
  }
  await runCloudTask(async () => {
    const gridSize = Number(els.orderGridSize.value || 9);
    const dataPages = await buildOrderPageImages(state.orderCart, gridSize);
    const uploadedPages = [];
    for (const page of dataPages) {
      const blob = dataUrlToBlob(page.dataUrl);
      uploadedPages.push(await uploadOrderImageBlob(blob, "orders"));
    }
    state.generatedOrderPages = dataPages;
    state.orderHistorySearch = "";
    const history = {
      id: crypto.randomUUID(),
      type: "generated",
      createdAt: new Date().toISOString(),
      category: normalizeOrderCategory(els.generatedOrderCategorySelect?.value),
      status: "발주완료",
      items: state.orderCart.map((item) => ({
        number: item.number,
        name: item.name,
        factory: item.factory,
        markers: item.markers,
        category: normalizeOrderCategory(els.generatedOrderCategorySelect?.value),
        status: "발주완료",
      })),
      pages: uploadedPages,
      pageData: dataPages.map((page) => page.dataUrl),
      memo: "발주 이미지판 생성",
    };
    state.orderHistory.unshift(history);
    persistOrderBoard();
    await pushOrderBoardState({ silent: true });
    renderOrderBoard();
    showToast(`${dataPages.length}장 발주 이미지를 생성했습니다.`);
  });
}

async function saveExistingOrderImages() {
  const files = [...(els.existingOrderImageInput.files || [])];
  if (!files.length) {
    showToast("기존 발주 이미지를 선택하세요.");
    return;
  }
  if (!isCloudSignedIn()) {
    showToast("먼저 로그인해야 이미지를 클라우드에 저장할 수 있습니다.");
    return;
  }
  await runCloudTask(async () => {
    const pages = [];
    const pageData = [];
    for (const file of files) {
      const image = await compressImageFile(file);
      pages.push(await uploadOrderImageBlob(image.blob, "external-orders"));
      pageData.push(image.dataUrl);
    }
    state.orderHistory.unshift({
      id: crypto.randomUUID(),
      type: "external",
      createdAt: new Date().toISOString(),
      category: normalizeOrderCategory(els.existingOrderCategorySelect?.value),
      status: "발주완료",
      productName: els.existingOrderProductInput.value.trim(),
      factory: els.existingOrderFactoryInput.value.trim(),
      search: els.existingOrderSearchInput.value.trim(),
      memo: els.existingOrderMemoInput.value.trim(),
      pages,
      pageData,
      items: [{ category: normalizeOrderCategory(els.existingOrderCategorySelect?.value), status: "발주완료" }],
    });
    state.orderHistorySearch = "";
    els.existingOrderImageInput.value = "";
    [els.existingOrderProductInput, els.existingOrderFactoryInput, els.existingOrderSearchInput, els.existingOrderMemoInput].forEach(
      (input) => {
        input.value = "";
      },
    );
    persistOrderBoard();
    await pushOrderBoardState({ silent: true });
    renderOrderBoard();
    showToast("기존 발주 이미지를 이력에 저장했습니다.");
  });
}

async function buildOrderPageImages(items, gridSize) {
  const columns = gridSize === 4 ? 2 : 3;
  const rows = gridSize === 6 ? 2 : gridSize === 4 ? 2 : 3;
  const cellWidth = 560;
  const cellHeight = 620;
  const pages = [];
  for (let start = 0; start < items.length; start += gridSize) {
    const chunk = items.slice(start, start + gridSize);
    const canvas = document.createElement("canvas");
    canvas.width = columns * cellWidth;
    canvas.height = rows * cellHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < chunk.length; i += 1) {
      const item = chunk[i];
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = col * cellWidth;
      const y = row * cellHeight;
      await drawOrderCell(ctx, item, x, y, cellWidth, cellHeight);
    }
    pages.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9) });
  }
  return pages;
}

async function drawOrderCell(ctx, item, x, y, width, height) {
  ctx.strokeStyle = "#dce2da";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
  ctx.fillStyle = "#202521";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(item.number || "", x + 24, y + 42);
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(trimCanvasText(ctx, item.name || "상품", width - 48), x + 24, y + 76);
  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#66706a";
  ctx.fillText(trimCanvasText(ctx, item.factory || "", width - 48), x + 24, y + 106);

  const image = await loadOrderImage(item);
  const box = fitImage(image.width, image.height, width - 48, height - 150);
  const imageX = x + 24 + box.x;
  const imageY = y + 126 + box.y;
  ctx.drawImage(image, imageX, imageY, box.width, box.height);

  (item.markers || []).forEach((marker, index) => {
    const cx = imageX + marker.x * box.width;
    const cy = imageY + marker.y * box.height;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#e53935";
    ctx.stroke();
    ctx.fillStyle = "#e53935";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(String(index + 1), cx - 7, cy + 8);
  });
}

function fitImage(imageWidth, imageHeight, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    x: (maxWidth - width) / 2,
    y: (maxHeight - height) / 2,
  };
}

function trimCanvasText(ctx, text, maxWidth) {
  let result = text;
  while (result.length > 1 && ctx.measureText(result).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result === text ? result : `${result.slice(0, -1)}...`;
}

async function shareOrderPage(index) {
  const page = state.generatedOrderPages[index];
  if (!page) return;
  const file = dataUrlToFile(page.dataUrl, `order-page-${index + 1}-${dateStamp()}.jpg`);
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ title: "발주 이미지", text: "발주 이미지입니다.", files: [file] });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  downloadDataUrl(file.name, page.dataUrl);
}

async function shareHistoryEntry(entryId) {
  const entry = state.orderHistory.find((item) => item.id === entryId);
  if (entry?.type === "text") {
    shareTextOrderEntry(entry);
    return;
  }
  const dataUrl = entry?.pageData?.[0] || (entry?.pages?.[0] ? await getOrderImageDataUrl(entry.pages[0]) : "");
  if (!dataUrl) return;
  const file = dataUrlToFile(dataUrl, `order-history-${dateStamp()}.jpg`);
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ title: "발주 이미지", text: entry.memo || "발주 이미지입니다.", files: [file] });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  downloadDataUrl(file.name, dataUrl);
}

async function compressImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, ORDER_IMAGE_MAX_SIZE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", ORDER_IMAGE_QUALITY));
  return { blob, dataUrl: canvas.toDataURL("image/jpeg", ORDER_IMAGE_QUALITY) };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function loadOrderImage(item) {
  const src = item.imageData || (item.imagePath ? await getOrderImageObjectUrl(item.imagePath) : "");
  return loadImage(src);
}

function setOrderImageElement(img, item) {
  if (item.imageData) {
    img.src = item.imageData;
    return;
  }
  if (!item.imagePath) return;
  getOrderImageObjectUrl(item.imagePath)
    .then((url) => {
      img.src = url;
    })
    .catch(() => {});
}

async function uploadOrderImageBlob(blob, folder) {
  await ensureCloudAccess();
  const path = `${state.cloud.user.id}/${folder}/${crypto.randomUUID()}.jpg`;
  const response = await fetch(`${state.cloud.url}/storage/v1/object/${ORDER_IMAGE_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: state.cloud.anonKey,
      Authorization: `Bearer ${state.cloud.accessToken}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
    },
    body: blob,
  });
  if (!response.ok) throw new Error(await response.text());
  return path;
}

async function getOrderImageObjectUrl(path) {
  if (orderImageUrlCache.has(path)) return orderImageUrlCache.get(path);
  await ensureCloudAccess();
  const response = await fetch(`${state.cloud.url}/storage/v1/object/${ORDER_IMAGE_BUCKET}/${path}`, {
    headers: {
      apikey: state.cloud.anonKey,
      Authorization: `Bearer ${state.cloud.accessToken}`,
    },
  });
  if (!response.ok) throw new Error(await response.text());
  const url = URL.createObjectURL(await response.blob());
  orderImageUrlCache.set(path, url);
  return url;
}

async function getOrderImageDataUrl(path) {
  const objectUrl = await getOrderImageObjectUrl(path);
  const response = await fetch(objectUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function dataUrlToFile(dataUrl, filename) {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

function downloadDataUrl(filename, dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

function productFieldValue(product, fieldId) {
  return product.fields?.[fieldId] || "";
}

function nextProductNumber() {
  const max = state.orderProducts.reduce((highest, product) => {
    const number = Number(String(product.number || "").replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `P${String(max + 1).padStart(4, "0")}`;
}

function removeOrderProduct(productId) {
  if (!confirm("상품을 삭제할까요? 이미 저장된 발주 이력은 유지됩니다.")) return;
  state.orderProducts = state.orderProducts.filter((product) => product.id !== productId);
  state.orderCart = state.orderCart.filter((item) => item.productId !== productId);
  if (state.selectedOrderProductId === productId) {
    state.selectedOrderProductId = "";
    state.orderMarkers = [];
  }
  persistOrderBoard();
  pushOrderBoardState({ silent: true }).catch(() => {});
  renderOrderBoard();
}

function removeCartItemByProduct(productId) {
  state.orderCart = state.orderCart.filter((item) => item.productId !== productId);
}

function orderActionButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function orderSmallButton(text, onClick) {
  return orderActionButton(text, "plain-action", onClick);
}

function emptyText(text) {
  const p = document.createElement("p");
  p.className = "panel-copy";
  p.textContent = text;
  return p;
}

function countPill(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function exportJson() {
  const payload = JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      groups: state.groups,
      tripLocations: state.tripLocations,
      logs: state.logs,
    },
    null,
    2,
  );
  downloadBlob(`ops-backup-${dateStamp()}.json`, payload, "application/json;charset=utf-8");
}

function exportCsv() {
  const header = ["id", "group", "tag", "location", "memo", "createdAt", "updatedAt", "completedAt"];
  const rows = state.logs.map((log) =>
    [log.id, log.group, log.tag, log.location || "", log.memo, log.createdAt, log.updatedAt, log.completedAt || ""]
      .map(csvCell)
      .join(","),
  );
  downloadBlob(`ops-logs-${dateStamp()}.csv`, [header.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      if (!Array.isArray(payload.groups) || !Array.isArray(payload.logs)) throw new Error("Invalid backup");
      state.groups = mergeGroupsWithDefaults(payload.groups);
      state.tripLocations = mergeTripLocations(payload.tripLocations || getTripLocationsFromGroups(state.groups));
      state.logs = payload.logs;
      state.selectedIds.clear();
      normalizeSelection();
      persist();
      render();
      showToast("백업을 가져왔습니다.");
    } catch {
      showToast("가져올 수 없는 JSON입니다.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}

async function installApp() {
  if (!state.deferredInstallPrompt) return;
  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  els.installBtn.hidden = true;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!location.protocol.startsWith("http")) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
