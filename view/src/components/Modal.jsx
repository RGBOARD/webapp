import React from 'react';
import './styles/Modal.css';

function Modal({isOpen, type, message, onConfirm, onCancel}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    {type === 'alert' && <h3>Notice</h3>}
                    {type === 'confirm' && <h3>Confirm Save</h3>}
                    {type === 'delete' && <h3>Delete</h3>}
                </div>
                <div className="modal-content">
                    <p>{message}</p>
                </div>
                <div className="modal-actions">
                    {type === 'alert' && (
                        <button className="modal-button" onClick={onConfirm}>OK</button>
                    )}
                    {type === 'confirm' && (
                        <>
                            <button className="modal-button cancel-button" onClick={onCancel}>Cancel</button>
                            <button className="modal-button confirm-button" onClick={onConfirm}>Save</button>
                        </>
                    )}
                    {type === 'delete' && (
                        <>
                            <button className="modal-button cancel-button" onClick={onCancel}>Cancel</button>
                            <button className="modal-button confirm-button" onClick={onConfirm}>Delete</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Modal;