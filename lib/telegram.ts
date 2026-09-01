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
  show: () => void;
  showProgress: (leaveActive?: boolean) => void;
};

type TelegramWebApp = {
  BackButton?: unknown;
  MainButton?: unknown;
  platform: string;
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
    return true;
  } catch {
    return false;
  }
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
  isBusy: boolean;
  isVisible: boolean;
  onClick: () => void;
  text: string;
};

export function setupTelegramMainButton({
  isBusy,
  isVisible,
  onClick,
  text,
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
