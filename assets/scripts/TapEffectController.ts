import { _decorator, Component, Node, Input, input, EventTouch, Graphics, UITransform, Color, tween, Vec3, UIOpacity, view, Camera, find } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('TapEffectController')
export class TapEffectController extends Component {

    @property(Color)
    starColor: Color = new Color(255, 220, 50, 255); // Màu vàng gold mặc định

    private effectRoot: Node | null = null;

    onLoad() {
        // Tạo một node gốc để chứa các hạt sao, đặt dưới Canvas
        this.effectRoot = new Node('TapEffectRoot');
        this.effectRoot.layer = this.node.layer; 
        
        const uiTransform = this.effectRoot.addComponent(UITransform);
        uiTransform.setContentSize(view.getVisibleSize());
        
        this.effectRoot.setParent(this.node);
        // Đảm bảo node này luôn nằm trên cùng (để không bị che)
        this.effectRoot.setSiblingIndex(999);
    }

    onEnable() {
        // Lắng nghe sự kiện chạm toàn màn hình
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    private onTouchStart(event: EventTouch) {
        if (!this.effectRoot) return;
        
        const uiLoc = event.getUILocation();
        const transform = this.effectRoot.getComponent(UITransform);
        if (!transform) return;

        // Chuyển đổi tọa độ chạm sang tọa độ local của Canvas
        const localPos = transform.convertToNodeSpaceAR(new Vec3(uiLoc.x, uiLoc.y, 0));
        this.spawnTapStars(localPos);
    }

    private spawnTapStars(center: Vec3) {
        // Bắn ra 5 đến 8 ngôi sao mỗi lần tap
        const numStars = 5 + Math.floor(Math.random() * 4); 
        for (let i = 0; i < numStars; i++) {
            this.createStarParticle(center);
        }
    }

    private createStarParticle(center: Vec3) {
        const starNode = new Node('TapStar');
        starNode.layer = this.effectRoot!.layer;
        starNode.setParent(this.effectRoot);
        starNode.setPosition(center);

        const graphics = starNode.addComponent(Graphics);
        graphics.fillColor = this.starColor;
        // Vẽ hình ngôi sao 5 cánh: bán kính ngoài 14, bán kính trong 6
        this.drawStar(graphics, 0, 0, 5, 14, 6); 
        graphics.fill();

        const opacity = starNode.addComponent(UIOpacity);
        
        // Quỹ đạo bay lan ra ngẫu nhiên
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 80;
        const targetX = center.x + Math.cos(angle) * distance;
        const targetY = center.y + Math.sin(angle) * distance;
        
        const duration = 0.4 + Math.random() * 0.3;
        const rotationAngle = (Math.random() - 0.5) * 360; // Xoay ngẫu nhiên
        
        const startScale = 0.4 + Math.random() * 0.7;
        starNode.setScale(new Vec3(startScale, startScale, 1));

        // Animation văng ra, xoay, nhỏ lại và mờ dần
        tween(starNode)
            .parallel(
                tween().to(duration, { position: new Vec3(targetX, targetY, 0) }, { easing: 'quadOut' }),
                tween().to(duration, { eulerAngles: new Vec3(0, 0, rotationAngle) }, { easing: 'quadOut' }),
                tween().to(duration, { scale: new Vec3(0.05, 0.05, 1) }, { easing: 'quadIn' }),
                tween(opacity).to(duration, { opacity: 0 }, { easing: 'quadIn' })
            )
            .call(() => {
                starNode.destroy();
            })
            .start();
    }

    private drawStar(g: Graphics, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        g.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            g.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            g.lineTo(x, y);
            rot += step;
        }
        g.lineTo(cx, cy - outerRadius);
        g.close();
    }
}
