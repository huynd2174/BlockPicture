import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

/**
 * Deprecated. Kept only so old scene references do not break.
 * Use PuzzleDragController for drag/snap gameplay.
 */
@ccclass('BlockTouch')
export class BlockTouch extends Component {
}
