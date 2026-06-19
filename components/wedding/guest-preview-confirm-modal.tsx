"use client";

import { useModal } from "./modal-provider";
import { guestPreviewConfirmMessage } from "@/lib/guest-preview-confirm";

export function GuestPreviewConfirmModalContent({
    stateLabel,
    isFamilia,
    onCancel,
    onConfirm,
}: {
    stateLabel: string;
    isFamilia: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="flex min-h-[17rem] flex-col justify-center py-2 text-center text-white">
            <h3 className="mb-5 text-2xl font-semibold tracking-wide text-white">
                Aviso
            </h3>
            <p className="mx-auto max-w-[19rem] text-sm leading-relaxed tracking-wide text-white/85">
                {guestPreviewConfirmMessage(stateLabel, { isFamilia })}
            </p>
            <div className="mt-8 flex flex-col gap-2">
                <button
                    type="button"
                    onClick={onConfirm}
                    className="flex min-h-[52px] w-full items-center justify-center rounded-sm border border-white/30 bg-white/10 px-5 py-4 text-[11px] font-medium tracking-[0.15em] uppercase text-white transition-all hover:bg-white/20"
                >
                    Sí, continuar
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-sm px-5 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-white/70 transition-all hover:text-white"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}

export function useGuestPreviewConfirmModal() {
    const { openModal, closeModal } = useModal();

    const openGuestPreviewConfirmModal = ({
        stateLabel,
        isFamilia,
        onConfirm,
    }: {
        stateLabel: string;
        isFamilia: boolean;
        onConfirm: () => void | Promise<void>;
    }) => {
        openModal(
            <GuestPreviewConfirmModalContent
                stateLabel={stateLabel}
                isFamilia={isFamilia}
                onCancel={closeModal}
                onConfirm={() => {
                    closeModal();
                    void onConfirm();
                }}
            />,
        );
    };

    return { openGuestPreviewConfirmModal };
}
