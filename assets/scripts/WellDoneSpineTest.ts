import { _decorator, Component, sp } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('WellDoneSpineTest')
export class WellDoneSpineTest extends Component {
    @property(sp.Skeleton)
    skeleton: sp.Skeleton | null = null;

    start() {
        if (!this.skeleton) {
            this.skeleton = this.getComponent(sp.Skeleton);
        }

        if (!this.skeleton) {
            console.error('Không tìm thấy sp.Skeleton trên node WellDoneSpine');
            return;
        }

        if (!this.skeleton.skeletonData) {
            console.error('Chưa gán WellDone.json vào SkeletonData');
            return;
        }

        // File WellDone có skin 1,2,3,4,5.
        // Skin default thường không hiện đủ chữ.
        this.skeleton.setSkin('1');
        this.skeleton.setSlotsToSetupPose();

        this.skeleton.clearTracks();

        // Chạy xuất hiện một lần
        this.skeleton.setAnimation(0, 'appear', false);

        // Sau đó loop nhẹ
        this.skeleton.addAnimation(0, 'loop', true, 0);
    }
}
