import { _decorator, Component, Node, Color, BlockInputEvents, UITransform, Label, Button, SpriteFrame, Vec3, tween, Tween, UIOpacity, find, view, Graphics, Sprite, math, Widget, sp } from 'cc';
import { GameHUDController } from './GameHUDController';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

@ccclass('EndgameUIController')
export class EndgameUIController extends Component {

    @property(Node)
    winPanel: Node | null = null;

    @property(Node)
    losePanel: Node | null = null;

    @property([SpriteFrame])
    confettiFrames: SpriteFrame[] = [];

    private uiRoot: Node | null = null;
    private fireworksActive = false;

    onLoad() {
        if (this.winPanel) {
            this.winPanel.active = false; // Hide initially
        }
        if (this.losePanel) {
            this.losePanel.active = false;
        }
    }

    public showWinPanel() {
        if (!this.winPanel || this.uiRoot) return;

        if (AudioManager.instance) AudioManager.instance.playWinLevel();

        const canvas = find('Canvas') || find('block/Canvas');
        if (!canvas) return;

        // 1. Root for Dark Background and Fireworks (placed behind WinPanel)
        this.uiRoot = new Node('EndgameRoot');
        this.uiRoot.layer = canvas.layer;
        const uiTransform = this.uiRoot.addComponent(UITransform);
        const winSize = view.getVisibleSize();
        uiTransform.setContentSize(winSize);

        const widget = this.uiRoot.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;

        // Darken screen
        const bgGraphics = this.uiRoot.addComponent(Graphics);
        bgGraphics.fillColor = new Color(0, 0, 0, 245);
        bgGraphics.rect(-winSize.width * 2, -winSize.height * 2, winSize.width * 4, winSize.height * 4);
        bgGraphics.fill();

        this.uiRoot.addComponent(BlockInputEvents);

        // Put uiRoot behind the winPanel
        if (this.winPanel.parent) {
            this.uiRoot.setParent(this.winPanel.parent);
            this.uiRoot.setSiblingIndex(this.winPanel.getSiblingIndex());
        } else {
            this.uiRoot.setParent(canvas);
        }

        // Fade in background
        const bgOpacity = this.uiRoot.addComponent(UIOpacity);
        bgOpacity.opacity = 0;
        tween(bgOpacity).to(0.5, { opacity: 255 }).start();

        // 2. Setup the user's WinPanel
        this.winPanel.active = true;
        this.winPanel.setPosition(Vec3.ZERO);

        const winOpacity = this.winPanel.getComponent(UIOpacity) || this.winPanel.addComponent(UIOpacity);
        winOpacity.opacity = 255;

        // Force WinPanel to be the last child so it renders on top
        if (this.winPanel.parent) {
            this.winPanel.setSiblingIndex(this.winPanel.parent.children.length - 1);
        }

        // Find and bind Continue button
        const continueBtnNode = this.winPanel.getChildByName('ContinueButton');
        if (continueBtnNode) {
            let button = continueBtnNode.getComponent(Button);
            if (!button) button = continueBtnNode.addComponent(Button);
            continueBtnNode.off(Button.EventType.CLICK, this.onContinueClicked, this);
            continueBtnNode.on(Button.EventType.CLICK, this.onContinueClicked, this);
        }

        // Find and play WellDoneSpine
        const spineNode = this.winPanel.getChildByName('WellDoneSpine');
        if (spineNode) {
            // Scale it down so it fits the screen better (0.45 was too big)
            spineNode.setScale(new Vec3(0.6, 0.6, 1));

            const skeleton = spineNode.getComponent(sp.Skeleton);
            if (skeleton) {
                skeleton.setSkin('1');
                skeleton.setSlotsToSetupPose();
                skeleton.clearTracks();
                skeleton.setAnimation(0, 'appear', false);
                skeleton.addAnimation(0, 'loop', true, 0);
            }
        }

        // Pop in animation for WinPanel
        Tween.stopAllByTarget(this.winPanel);
        this.winPanel.setScale(new Vec3(0, 0, 0));
        tween(this.winPanel)
            .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();

        // 3. Fireworks Effect - Burst once with a lot of particles
        this.fireworksActive = true;
        this.spawnFireworkBurst();
    }

    private onContinueClicked() {
        if (AudioManager.instance) AudioManager.instance.playClickBtn();

        this.fireworksActive = false;

        // Hide UI
        if (this.uiRoot) {
            tween(this.uiRoot.getComponent(UIOpacity)!)
                .to(0.2, { opacity: 0 })
                .call(() => {
                    this.uiRoot?.destroy();
                    this.uiRoot = null;
                })
                .start();
        }

        if (this.winPanel) {
            Tween.stopAllByTarget(this.winPanel);
            tween(this.winPanel)
                .to(0.2, { scale: new Vec3(0, 0, 0) })
                .call(() => {
                    this.winPanel!.active = false;
                })
                .start();
        }

        if (this.losePanel) {
            Tween.stopAllByTarget(this.losePanel);
            tween(this.losePanel)
                .to(0.2, { scale: new Vec3(0, 0, 0) })
                .call(() => {
                    this.losePanel!.active = false;
                })
                .start();
        }

        // Restart Game
        const canvas = find('Canvas') || find('block/Canvas');
        const hud = canvas?.getComponent(GameHUDController) || canvas?.getComponentInChildren(GameHUDController);
        if (hud) {
            hud.restartLevel(true);
        }
    }

    private spawnFireworkBurst() {
        if (!this.fireworksActive || this.confettiFrames.length === 0 || !this.uiRoot) return;

        // Bắn ra 150-200 hạt pháo hoa cùng một lúc để hiệu ứng rực rỡ hơn
        const count = 150 + Math.floor(Math.random() * 50);
        for (let i = 0; i < count; i++) {
            this.createConfettiParticle();
        }
    }

    private createConfettiParticle() {
        const frame = this.confettiFrames[Math.floor(Math.random() * this.confettiFrames.length)];
        const node = new Node('Confetti');
        node.layer = this.uiRoot!.layer;
        node.setParent(this.uiRoot);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = frame;

        const winSize = view.getVisibleSize();
        // Phân bổ đều chiều ngang
        const startX = (Math.random() - 0.5) * winSize.width * 1.2;
        // Bắn từ sâu hơn dưới đáy màn hình (cách đáy 1 khoảng xa)
        const startY = -winSize.height * 0.5 - 300;

        node.setPosition(startX, startY, 0);

        // Góc bắn ngẫu nhiên và toả ra hai bên
        const targetX = startX + (Math.random() - 0.5) * winSize.width * 0.8;
        const targetY = (0.2 + Math.random() * 0.7) * winSize.height;

        const duration = 1.0 + Math.random() * 1.5;
        const rotationAngle = (Math.random() - 0.5) * 1080;

        const scaleBase = 0.5 + Math.random() * 1.0;
        node.setScale(new Vec3(scaleBase, scaleBase, scaleBase));
        // Để tàng hình ban đầu, tránh nhấp nháy
        node.setScale(new Vec3(0, 0, 0));

        const opacity = node.addComponent(UIOpacity);

        const delay = Math.random() * 0.2; // Độ trễ nhẹ tạo cảm giác nổ tự nhiên

        tween(node)
            .delay(delay)
            .call(() => { node.setScale(new Vec3(scaleBase, scaleBase, scaleBase)); })
            .parallel(
                tween().to(duration, { position: new Vec3(targetX, targetY, 0) }, { easing: 'quadOut' }),
                tween().to(duration, { eulerAngles: new Vec3(0, 0, rotationAngle) }),
            )
            .call(() => {
                tween(node)
                    .to(duration * 1.5, { position: new Vec3(targetX, -winSize.height * 0.6, 0) }, { easing: 'quadIn' })
                    .start();
                tween(opacity)
                    .to(duration * 1.5, { opacity: 0 })
                    .call(() => node.destroy())
                    .start();
            })
            .start();
    }

    public showLosePanel() {
        if (!this.losePanel || this.uiRoot) return;

        const canvas = find('Canvas') || find('block/Canvas');
        if (!canvas) return;

        // 1. Root for Dark Background
        this.uiRoot = new Node('EndgameRoot');
        this.uiRoot.layer = canvas.layer;
        const uiTransform = this.uiRoot.addComponent(UITransform);
        const winSize = view.getVisibleSize();
        uiTransform.setContentSize(winSize);

        const widget = this.uiRoot.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;

        // Darken screen
        const bgGraphics = this.uiRoot.addComponent(Graphics);
        bgGraphics.fillColor = new Color(0, 0, 0, 245);
        bgGraphics.rect(-winSize.width * 2, -winSize.height * 2, winSize.width * 4, winSize.height * 4);
        bgGraphics.fill();

        this.uiRoot.addComponent(BlockInputEvents);

        // Put uiRoot behind the losePanel
        if (this.losePanel.parent) {
            this.uiRoot.setParent(this.losePanel.parent);
            this.uiRoot.setSiblingIndex(this.losePanel.getSiblingIndex());
        } else {
            this.uiRoot.setParent(canvas);
        }

        // Fade in background
        const bgOpacity = this.uiRoot.addComponent(UIOpacity);
        bgOpacity.opacity = 0;
        tween(bgOpacity).to(0.5, { opacity: 255 }).start();

        // 2. Setup the user's LosePanel
        this.losePanel.active = true;
        this.losePanel.setPosition(Vec3.ZERO);

        const loseOpacity = this.losePanel.getComponent(UIOpacity) || this.losePanel.addComponent(UIOpacity);
        loseOpacity.opacity = 255;

        // Force LosePanel to be the last child so it renders on top
        if (this.losePanel.parent) {
            this.losePanel.setSiblingIndex(this.losePanel.parent.children.length - 1);
        }

        // Find and bind Retry button
        const retryBtnNode = this.losePanel.getChildByName('RetryButton');
        if (retryBtnNode) {
            let button = retryBtnNode.getComponent(Button);
            if (!button) button = retryBtnNode.addComponent(Button);
            retryBtnNode.off(Button.EventType.CLICK, this.onContinueClicked, this);
            retryBtnNode.on(Button.EventType.CLICK, this.onContinueClicked, this);
        }

        // Pop in animation for LosePanel
        Tween.stopAllByTarget(this.losePanel);
        this.losePanel.setScale(new Vec3(0, 0, 0));
        tween(this.losePanel)
            .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }
}
