type TelegramBackButton = {
  hide: () => void;
  offClick: (callback: () => void) => void;
  onClick: (callback: () => void) => void;
  show: () => void;
};

type TelegramMainButton = {
  disable: () => void;
  enable: () => void;
  hide: () => void;
  hideProgress: () => void;
  offClick: (callback: () => void) => void;
  onClick: (callback: () => void) => void;
  setText: (text: string) => void;
  setParams?: (params: {
    color?: string;
    text_color?: string;
  }) => void;
  show: () => void;
  showProgress: (leaveActive?: boolean) => void;
};

type TelegramWebApp = {
  BackButton?: unknown;
  initDataUnsafe?: {
    start_param?: unknown;
  };
  MainButton?: unknown;
  platform: string;
  expand?: () => void;
  ready: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: unknown;
  };
};

let readyWasCalled = false;

function isTelegramWebAppObject(value: unknown): value is TelegramWebApp {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.platform === "string" &&
    typeof candidate.ready === "function"
  );
}

function isTelegramBackButtonObject(
  value: unknown,
): value is TelegramBackButton {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.hide === "function" &&
    typeof candidate.offClick === "function" &&
    typeof candidate.onClick === "function" &&
    typeof candidate.show === "function"
  );
}

function isTelegramMainButtonObject(
  value: unknown,
): value is TelegramMainButton {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.disable === "function" &&
    typeof candidate.enable === "function" &&
    typeof candidate.hide === "function" &&
    typeof candidate.hideProgress === "function" &&
    typeof candidate.offClick === "function" &&
    typeof candidate.onClick === "function" &&
    typeof candidate.setText === "function" &&
    typeof candidate.show === "function" &&
    typeof candidate.showProgress === "function"
  );
}

function safelyRunTelegramMethod(method: () => void): void {
  try {
    method();
  } catch {
    // Telegram SDK errors must not affect the browser application.
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") {
    return null;
  }

  const webApp = (window as TelegramWindow).Telegram?.WebApp;

  return isTelegramWebAppObject(webApp) ? webApp : null;
}

export function isRunningInTelegram(): boolean {
  const platform = getTelegramWebApp()?.platform.trim().toLowerCase();

  return Boolean(platform && platform !== "unknown");
}

export function getTelegramStartProductHandle(): string | null {
  const startParam = getTelegramWebApp()?.initDataUnsafe?.start_param;

  if (typeof startParam !== "string" || !startParam.startsWith("product_")) {
    return null;
  }

  const handle = startParam.slice("product_".length).trim();

  return /^[a-z0-9][a-z0-9-]{0,254}$/i.test(handle) ? handle : null;
}

export function initializeTelegramWebApp(): boolean {
  const webApp = getTelegramWebApp();

  if (!webApp || !isRunningInTelegram()) {
    return false;
  }

  if (readyWasCalled) {
    return true;
  }

  try {
    webApp.ready();
    readyWasCalled = true;
  } catch {
    return false;
  }

  if (typeof webApp.expand === "function") {
    safelyRunTelegramMethod(() => webApp.expand?.());
  }

  return true;
}

export function setupTelegramBackButton(
  isVisible: boolean,
  onClick: () => void,
): () => void {
  const webApp = getTelegramWebApp();

  if (
    !webApp ||
    !isRunningInTelegram() ||
    !isTelegramBackButtonObject(webApp.BackButton)
  ) {
    return () => undefined;
  }

  const backButton = webApp.BackButton;

  if (!isVisible) {
    try {
      backButton.hide();
    } catch {
      // Telegram SDK errors must not affect the browser application.
    }

    return () => undefined;
  }

  let listenerWasRegistered = false;

  try {
    backButton.onClick(onClick);
    listenerWasRegistered = true;
    backButton.show();
  } catch {
    if (listenerWasRegistered) {
      try {
        backButton.offClick(onClick);
      } catch {
        // Telegram SDK errors must not affect the browser application.
      }
    }

    return () => undefined;
  }

  return () => {
    try {
      backButton.offClick(onClick);
    } catch {
      // Telegram SDK errors must not affect the browser application.
    }

    try {
      backButton.hide();
    } catch {
      // Telegram SDK errors must not affect the browser application.
    }
  };
}

type TelegramMainButtonOptions = {
  color?: string;
  isBusy: boolean;
  isVisible: boolean;
  onClick: () => void;
  text: string;
  textColor?: string;
};

export function setupTelegramMainButton({
  color,
  isBusy,
  isVisible,
  onClick,
  text,
  textColor,
}: TelegramMainButtonOptions): () => void {
  const webApp = getTelegramWebApp();

  if (
    !webApp ||
    !isRunningInTelegram() ||
    !isTelegramMainButtonObject(webApp.MainButton)
  ) {
    return () => undefined;
  }

  const mainButton = webApp.MainButton;
  const normalizedText = text.trim();

  if (!isVisible || !normalizedText) {
    safelyRunTelegramMethod(() => mainButton.hideProgress());
    safelyRunTelegramMethod(() => mainButton.hide());
    return () => undefined;
  }

  let listenerWasRegistered = false;

  try {
    if (typeof mainButton.setParams === "function") {
      mainButton.setParams({ color, text_color: textColor });
    }
    mainButton.setText(normalizedText);

    if (isBusy) {
      mainButton.disable();
      mainButton.showProgress();
    } else {
      mainButton.hideProgress();
      mainButton.enable();
    }

    mainButton.onClick(onClick);
    listenerWasRegistered = true;
    mainButton.show();
  } catch {
    if (listenerWasRegistered) {
      safelyRunTelegramMethod(() => mainButton.offClick(onClick));
    }

    safelyRunTelegramMethod(() => mainButton.hideProgress());
    safelyRunTelegramMethod(() => mainButton.hide());
    return () => undefined;
  }

  return () => {
    safelyRunTelegramMethod(() => mainButton.offClick(onClick));
    safelyRunTelegramMethod(() => mainButton.hideProgress());
    safelyRunTelegramMethod(() => mainButton.hide());
  };
}
