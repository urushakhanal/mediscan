import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

const DeleteConfirmationDialog = ({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
    title = 'Delete item',
    description = 'This action cannot be undone.',
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[1.75rem] border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                <div className="p-6">
                    <DialogHeader>
                        <p className="text-xs uppercase tracking-[0.28em] text-rose-600 dark:text-rose-300">Confirm delete</p>
                        <DialogTitle className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="inline-flex rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteConfirmationDialog;
