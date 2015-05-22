/*global defineSuite*/
defineSuite([
        'Core/BoundingRectangle',
        'Core/Color',
        'Renderer/ClearCommand',
        'Specs/createContext'
    ], 'Renderer/Clear', function(
        BoundingRectangle,
        Color,
        ClearCommand,
        createContext) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn*/

    var context;

    beforeAll(function() {
        context = createContext();
    });

    afterAll(function() {
        context.destroyForSpecs();
    });

    it('default clear', function() {
        ClearCommand.ALL.execute(context);
        expect(context.readPixels()).toEqual([0, 0, 0, 0]);
    });

    it('clears to white', function() {
        ClearCommand.ALL.execute(context);
        expect(context.readPixels()).toEqual([0, 0, 0, 0]);

        var command = new ClearCommand({
            color : Color.WHITE
        });
        command.execute(context);
        expect(context.readPixels()).toEqual([255, 255, 255, 255]);
    });

    it('clears with a color mask', function() {
        ClearCommand.ALL.execute(context);
        expect(context.readPixels()).toEqual([0, 0, 0, 0]);

        var command = new ClearCommand({
            color : Color.WHITE,
            renderState : context.createRenderState({
                colorMask : {
                    red : true,
                    green : false,
                    blue : true,
                    alpha : false
                }
            })
        });
        command.execute(context);
        expect(context.readPixels()).toEqual([255, 0, 255, 0]);
    });

    it('clears with scissor test', function() {
        var command = new ClearCommand({
            color : Color.WHITE
        });

        command.execute(context);
        expect(context.readPixels()).toEqual([255, 255, 255, 255]);

        command.color = Color.BLACK;
        command.renderState = context.createRenderState({
            scissorTest : {
                enabled : true,
                rectangle : new BoundingRectangle()
            }
        });

        command.execute(context);
        expect(context.readPixels()).toEqual([255, 255, 255, 255]);

        command.renderState = context.createRenderState({
            scissorTest : {
                enabled : true,
                rectangle : new BoundingRectangle(0, 0, 1, 1)
            }
        });

        command.execute(context);
        expect(context.readPixels()).toEqual([0, 0, 0, 255]);
    });

    it('clears a framebuffer color attachment', function() {
        var colorTexture = context.createTexture2D({
            width : 1,
            height : 1
        });
        var framebuffer = context.createFramebuffer({
            colorTextures : [colorTexture]
        });

        var command = new ClearCommand({
            color : new Color(0.0, 1.0, 0.0, 1.0),
            framebuffer : framebuffer
        });
        command.execute(context);

        expect(context.readPixels({
            framebuffer : framebuffer
        })).toEqual([0, 255, 0, 255]);

        framebuffer = framebuffer.destroy();
    });

    it('fails to read pixels (width)', function() {
        expect(function() {
            expect(context.readPixels({
                width : -1
            })).toEqual([0, 0, 0, 0]);
        }).toThrowDeveloperError();
    });

    it('fails to read pixels (height)', function() {
        expect(function() {
            expect(context.readPixels({
                height : -1
            })).toEqual([0, 0, 0, 0]);
        }).toThrowDeveloperError();
    });
}, 'WebGL');