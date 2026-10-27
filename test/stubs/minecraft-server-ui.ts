const noopSubscription = { unsubscribe() {} };

export const ActionFormData = class {
	title() {
		return this;
	}
	body() {
		return this;
	}
	button() {
		return this;
	}
	divider() {
		return this;
	}
	async show() {
		return { canceled: true, cancelationReason: "UserClosed" };
	}
};

export const MessageFormData = class {
	title() {
		return this;
	}
	body() {
		return this;
	}
	button1() {
		return this;
	}
	button2() {
		return this;
	}
	async show() {
		return { canceled: true, cancelationReason: "UserClosed" };
	}
};

export const ModalFormData = class {
	title() {
		return this;
	}
	async show() {
		return { canceled: true, cancelationReason: "UserClosed" };
	}
};

export const FormCancelationReason = {
	UserBusy: "UserBusy",
	UserClosed: "UserClosed",
};

export const uiManager = { closeAllFormsUi: () => noopSubscription };
