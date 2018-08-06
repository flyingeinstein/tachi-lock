import React, { Component } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text, View,
    Animated, Easing
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import Svg,{
    Circle, G, Path, Text as SvgText
//    Ellipse,LinearGradient,RadialGradient,Line,Polygon,Polyline,Rect,Symbol,Use,Defs,Stop
} from 'react-native-svg';
import { Spring, config as SpringConfig, Transition, animated, interpolate } from 'react-spring/dist/native';

type State = {
    targets: [],
    layout: { x:number, y:number, width:number, height:number },
    holding: {
        x: number,
        y: number,
        since: Date,
        radius: Animated,
    },
    point: { x:number, y:number }
};

type NotchStyle = {
    fill: string,
    strokeWidth: number,
    stroke: string
};

const defaultTargetStyle : NotchStyle = {
    fill: 'rgba(255,255,255,0.3)',
    strokeWidth: 0,
    stroke: 'transparent'
};

type Props = {
    // we we currently are. For example, where the external position of hardware is. If null, this is not rendered.
    // this property is simply visual and not user interactive. This property is not used to 2-way bind the control, see
    // the 'target' property.
    value?: number,

    // if different than value, then we are currently in motion to this position. I.e. our stop position.
    // Interaction is really with this target property and when coupled with onDropped this control becomes bound.
    target: number,

    // positions if very flexible and can be given as a function or array of:
    //    * numbers that represent stop positions
    //    * objects which must then contain a value field which is a number or function
    targets: [] | () => [],

    // the default size of each element if not specified as a field of the position element.
    defaultRadius?: number,

    // the radius of arcs if two targets are intersecting
    intersectionRadius?: number,

    // the width of the track between targets
    trackSize?: number,

    // the space between a target and the outline
    outlineMargin?: number,

    // when dragging the target this is the size of the drag indicator or hot spot.
    hotspotSize?: number,

    // will disable user interaction.
    // The 'value' property can still be rendered but visuals associated with target are hidden.
    disable?: boolean,

    targetStyle?: NotchStyle,
    hotspotStyle?: NotchStyle,
    outlineStyle?: NotchStyle,

    // called each time the user drags to a new position and hasnt yet let go
    onTracking: (target, selection) => void,

    // called when the user lets go on a new target position
    onDropped: (target, selection) => void
};

type NotchProps = {
    value: number
};

type NotchState = {

};

export class Notch extends Component<NotchProps, NotchState> {
    render() {
        let { y, value } = this.props;
        return <SvgText x={0} y={y+5} textAnchor='middle' fill='rgba(255,255,255,0.7)'>{this.props.children}</SvgText>;
    }
}


export default class NotchedTrackbar extends Component<Props, State> {
    static defaultProps = {
        defaultRadius: 64,
        hotspotSize: 96,
        intersectionRadius: 6,
        trackSize: 3,
        hotspotStyle: {
            strokeWidth: 16,
            stroke: 'rgba(255,100,100,0.3)',
            fill: 'transparent'
        },
        outlineStyle: {
            fill: "none",
            strokeWidth: 1.5,
            stroke:'rgba(255,255,255,0.8)'
        }
    };

    Notch = Notch;

    constructor(props) {
        super(props);
        this.state = {
            targets: [],
            selection: []
        };

        this.animation = this.animation.bind(this);
        this.positionDragHandler = this.positionDragHandler.bind(this);
        this.clickHandler = this.clickHandler.bind(this);
        this.onLayout = this.onLayout.bind(this);
        this.onTouchGrant = this.onTouchGrant.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchRelease = this.onTouchRelease.bind(this);
    }

    // retrieve numeric positions by resolving props.positions into an array that we can render.
    resolvePositions() {
        let targets = this.props.targets;
        if (typeof targets === "function") {
            targets = targets();
        }
        if (targets && Array.isArray(targets)) {
            targets = targets.map(e => {
                if (typeof e === "number") {
                    e = {
                        value: e,
                        radius: this.props.defaultRadius || 64
                    };
                } else if (!e.value)
                    return null;    // cannot resolve this position

                return e;
            });
        } else targets = [];

        if(this.props.children && this.props.children.length) {
            targets = this.props.children.map((c,key) => {
                if(!c) return undefined;
                let { value, radius, selectable, fill, stroke, strokeWidth, style, ...rest } = c.props;
                return {
                    id: key,
                    x:0,
                    y: value,
                    value,
                    radius,
                    selectable,
                    ...rest,
                    component: c,
                    style: {
                        fill: fill || defaultTargetStyle.fill,
                        stroke: stroke || defaultTargetStyle.stroke,
                        strokeWidth: strokeWidth || defaultTargetStyle.strokeWidth,
                        ...style
                    }
                }
            }).concat(targets);
        }

        targets = targets.concat(this.state.targets).filter(t => t);
        return targets;
    }

    getContainerStyle() {
        let { width, border } = this.props;
        return [
            styles.container,
            this.props.disable ? styles.disable : null
        ];
    }

    getTargetStyle(elementStyle) {
        let { border } = this.props;
        return [
            styles.touchable,
            styles.target,
            {
                borderWidth: border ? border : 1
            },
            this.props.disable ? styles.disable : null,
            elementStyle
        ];
    }

    // compute the anchors between two targets
    // this first computes the intersection between the two targets, if it exists then a single shared anchor will
    // be returned. Otherwise since these targets dont intersect an anchor will be returned for each target that
    // will need to be seperated with a straight line
    computeAnchor(t1, t2, ar=0) : [] {
        // warning: t2 must come after t1
        let t1ar = { x:t1.x, y:t1.y, radius:t1.radius+ar };
        let t2ar = { x:t2.x, y:t2.y, radius:t2.radius+ar };
        let ir = (this.props.intersectionRadius || 6);
        let irTrackSize = ir + (this.props.trackSize || 4)/2;
        let dist = t2.y - t1.y;
        //let gap = dist - t1.radius - t2.radius;
        if(dist < t1ar.radius + t2ar.radius) {
            // intersects, find the intersection point in x,y and return a single shared anchor
            let y = (dist*dist - t2ar.radius*t2ar.radius + t1ar.radius*t1ar.radius) / (2*dist);
            let x = Math.sqrt(t1ar.radius*t1ar.radius - y*y);
            if(x > irTrackSize)
                return [{ x, y:t1.y + y }];
            // else the gap was too small so we fall-through and create two anchors that will be close together
        }

        // return two anchors giving a gap for the track width
        let ts2 = irTrackSize*irTrackSize;
        return [{
            x: irTrackSize,
            y: t1.y + Math.sqrt( t1ar.radius*t1ar.radius - ts2)
        }, {
            x: irTrackSize,
            y: t2.y - Math.sqrt( t2ar.radius*t2ar.radius - ts2)
        }];
    }

    computeOutlineAnchors(targets) : [] {
        const ir = this.props.intersectionRadius || 6;
        let prev = targets[0];
        return targets.slice(1).map( t => {
            let a = {
                    i: prev,
                    j: t,
                    anchors: this.computeAnchor(prev, t, ir)
                };
            prev = t;
            return a;
        });
    }

    // compute an arc to join two circles A+B through their intersection point at I
    computeOutlineArc(A, B, I, radius) {
        // remember A and B dont have an x (it is always 0)
        const Va = { x:(-I.x), y:(A.y-I.y) }; // vector between I and A
        const Vb = { x:(-I.x), y:(B.y-I.y) }; // vector between I and B
        Va.length = Math.sqrt(Va.x*Va.x + Va.y*Va.y);
        Vb.length = Math.sqrt(Vb.x*Vb.x + Vb.y*Vb.y);
        Va.ratio = radius / Va.length;
        Vb.ratio = radius / Vb.length;
        return {
            op: 'A',
            s: { x:-I.x-Va.x*Va.ratio, y:I.y+Va.y*Va.ratio },
            t: { x:-I.x-Vb.x*Vb.ratio, y:I.y+Vb.y*Vb.ratio },
            radius
        }
    }

    computeOutlineArcs(anchors) {
        const ir = this.props.intersectionRadius || 6;
        let prev = null;
        let arcs = [];
        anchors.forEach(a => {
            if(a.anchors.length===1) {
                // intersecting targets
                let arc = this.computeOutlineArc(a.i, a.j, a.anchors[0], ir);
                if(prev)
                    arcs.push({ op:'A', radius: a.i.radius, sweep:0, s: prev.t, t: arc.s });
                else
                    arcs.push({ op: 'A', radius: a.i.radius, large:(arc.s.y<a.i.y)?0:1, sweep:0, s:{x:-arc.s.x,y:arc.s.y}, t:{x:arc.s.x,y:arc.s.y} });
                arcs.push(arc);
                prev = arc;
            } else if(a.anchors.length===2) {
                // non-intersecting, with lines in between
                const top = this.computeOutlineArc(a.i, { x:-ir, y: a.anchors[0].y }, a.anchors[0], ir);
                if(prev)
                    arcs.push({ op:'A', radius: a.i.radius, sweep:0, s: prev.t, t: top.s });
                else
                    arcs.push({ op: 'A', radius: a.i.radius, large:(top.s.y<a.i.y)?0:1, sweep:0, s:{x:-top.s.x,y:top.s.y}, t:{x:top.s.x,y:top.s.y} });
                const bottom = this.computeOutlineArc({ x:-ir, y: a.anchors[1].y }, a.j, a.anchors[1], ir);
                arcs.push(top);
                arcs.push({ op:'L', s: top.t, t: bottom.s});
                arcs.push(bottom);
                prev = bottom;
            }
        });

        // compute the mirror-reversal of the previous arcs (except for first arc)
        let mirrored = arcs.reverse().map(a => {
            return {
                op:a.op,
                radius:a.radius,
                large:a.large,
                sweep:a.sweep,
                s:{ x: -a.t.x, y:a.t.y },
                t:{ x: -a.s.x, y:a.s.y }
            }
        });

        // now add the bottom/last arc
        arcs.push({
            op: 'A',
            radius: anchors[anchors.length-1].j.radius,
            large:1,
            sweep:0,
            s:{x:prev.t.x,y:prev.t.y},
            t:{x:-prev.t.x,y:prev.t.y}
        });


        // now add all the mirrored arcs
        arcs.push.apply(arcs, mirrored);

        return arcs;
    }

    // does A obscure B?
    // A must be bigger than B or test fails
    static obscures(A, B) {
        // if we put A inside B, how much room would we have + or -?
        let margin = (A.radius - B.radius)+2;
        return (A.y > B.y - margin && A.y < B.y + margin);
    }

    computeOutline(targets) {
        let prev = null;
        let outlineMargin = this.props.outlineMargin || this.props.trackSize;
        outlineMargin += this.props.outlineStyle.strokeWidth/2; // add the outline half-width

        // recreate objects and keep ordinal as id field
        // sort by radius so we can do our obscure tests
        targets = targets
            .map(t=> ({ ...t, radius:t.radius+outlineMargin }))    // must copy since sort is in-place
            .sort( (a,b) => a.radius < b.radius );

        for(let a=0;a<targets.length; a++) {
            let A = targets[a];
            if(!A) continue;

            // check all targets after this one (i.e. all targets of smaller radius)
            for(let b=a+1; b<targets.length; b++) {
                B = targets[b];
                if(!B) continue;

                if(NotchedTrackbar.obscures(A, B))
                    targets[b]=null;    // remove element since its obscured
            }
        }

        // remove nulled entries and resort back by target position
        targets = targets
            .filter(t => t!==null )
            .sort( (a,b) => a.y > b.y );    // now re-sort by location on the line

        let anchors = this.computeOutlineAnchors(targets);
        let arcs = this.computeOutlineArcs(anchors);
        return {
            targets,
            anchors,
            arcs
        };
    }

    static closestTargetTo(coord, targets) {
        let closestT=null, closestV, largestRadius, v;
        targets.forEach(t => {
            if(t.selectable===false)
                return;
            v=Math.abs(t.y-coord.y);
            if(closestV===undefined || v<closestV) {
                closestT = t;
                closestV = v;
            }
            if(largestRadius===undefined || t.radius>largestRadius)
                largestRadius = t.radius;
        });
        largestRadius *= 1.6;
        return (coord.x > closestT.x - largestRadius && coord.x < closestT.x + largestRadius)
            ? closestT
            : null;
    }

    renderOutlineAnchors(anchors) {
        let renderAnchor = (a,id) => [
            <Circle key={'L'+a.id} cx={-a.x} cy={a.y} r={2} strokeWidth={0} fill='rgba(255,80,80,0.5)' />,
            <Circle key={'R'+a.id} cx={a.x} cy={a.y} r={2} strokeWidth={0} fill='rgba(255,80,80,0.5)' />
        ];
        return anchors.map( a => {
            return <G key={`A${a.i.id}-${a.j.id}`}>
                { a.anchors && a.anchors.length > 0 && renderAnchor(a.anchors[0], a.i.id) }
                { a.anchors && a.anchors.length>1 && renderAnchor(a.anchors[1],a.j.id) }
            </G>;
        });
    }

    renderOutline(outline) {
        // iterate through all elements
        let prev = null;
        let segments = outline.arcs.map( a=> {
            let prefix = (prev===null || (prev.x!==a.s.x || prev.y!==a.s.y))
                ? `M${a.s.x},${a.s.y} `
                : '';
            prev = a.t;
            switch(a.op) {
                case 'A': return prefix+`A${a.radius},${a.radius} 0 ${a.large||0},${(a.sweep!==undefined)?a.sweep:1} ${a.t.x},${a.t.y}`;
                case 'L': return prefix+`L${a.t.x},${a.t.y}`;
            }
        });

        //console.log(segments);
        return segments.join(' ');
    }

    renderTargets(targets) {
        /*let defaultStyle = {
            ...defaultTargetStyle,
            ...this.props.targetStyle
        };*/
        let AnimatedCircle = animated(Circle);
        let AnimatedG = animated(G);
        return (
            <G>
                { targets.map( t => {
                    if(!t) return; //console.log("duck a fuck");
                    //let style = { ...defaultStyle, ...t.style };
                    let { component, ...props } = t; // get props of t except a few we dont want
                    let inner = t.component && React.cloneElement(t.component, props);
                    return (
                        <Spring key={t.id}
                                config={{ tension: 170, friction: 7 }}
                                from={{ y: t.y, radius: 4, opacity: 0 }}
                                to={{ y: t.y, radius: t.radius, opacity: 0.6 }}
                                delay={10}
                        >
                            {({ y, radius, opacity }) => {
                                //if(t.id===1) console.log(radius, opacity);
                                return (
                                    <AnimatedG>
                                    <AnimatedCircle key={'C'+t.id} cx={0} cy={y} r={radius} {...t.style} />
                                        { inner }
                                    </AnimatedG>
                                )}
                            }
                        </Spring>
                    )})}
            </G>
        );
    }

    componentDidMount() {
        //this.startLoop();
    }

    componentWillUnmount() {
        this.stopLoop();
    }

    animationUpdateTarget(t, min, max) {
        // move the second component
        let y = t.reverse ? t.y-t.speed : t.y+t.speed;
        let reverse = t.reverse;
        if(y < min)
            reverse = false;
        else if(y > max)
            reverse = true;
        y = Math.min(max, Math.max(min, y));
        return {
            ...t,
            y,
            reverse: reverse
        };
    }

    animation(timestamp) {

    }

    startLoop() {
        if( !this._frameId ) {
            this._frameId = window.requestAnimationFrame( this.animation );
        }
    }

    stopLoop() {
        window.cancelAnimationFrame( this._frameId );
        // Note: no need to worry if the loop has already been cancelled
        // cancelAnimationFrame() won't throw an error
    }

    // translates a point coordinate on the control view into the SVG coordinates system
    screenToSvgViewport(p) {
        return {
            x: p.x-this.state.layout.width/2,
            y: p.y
        }
    }

    positionDragHandler(e) {
    }

    clickHandler(e) {
        //this.setState({ point: {x:e.x, y:e.y}});
    }

    // The event 'ev' is of type 'GestureResponderEvent'. Documentation for ev.nativeEvent:
    // https://facebook.github.io/react-native/docs/gesture-responder-system.html
    onTouchEvent(name, ev) {
        console.log(
            `[${name}] ` +
            `root_x: ${ev.nativeEvent.pageX}, root_y: ${ev.nativeEvent.pageY} ` +
            `target_x: ${ev.nativeEvent.locationX}, target_y: ${ev.nativeEvent.locationY} ` +
            `target: ${ev.nativeEvent.target}`
        );
    }

    animate(initial, target, callback) {
        let value = new Animated.Value(initial);
        let anim = new Animated.timing(
            value,
            {
                toValue: target,
                duration: 0.5,
                easing: Easing.bounce
            }
        );
        let listenerId = value.addListener(callback);
        return anim.start( () => { value.removeListener(listenerId)});
    }

    onTouchGrant(ev) {
        let { x, y } = this.screenToSvgViewport({ x:ev.nativeEvent.locationX, y:ev.nativeEvent.locationY })
        let targets = this.resolvePositions();
        let closest = NotchedTrackbar.closestTargetTo({x,y}, targets);
        if(closest) {
            let selection = [ closest ];
            if(this.props.onTracking && this.props.onTracking(closest, selection)===false)
                return; // abort if handler returns false
            this.setState({
                holding: {
                    x, y,
                    selection,
                    closestTarget: closest,
                    radius: closest.radius * 1.08
                }
            });
        }
    }

    onTouchMove(ev) {
        let { x, y } = this.screenToSvgViewport({ x:ev.nativeEvent.locationX, y:ev.nativeEvent.locationY });
        let targets = this.resolvePositions();
        let closest = NotchedTrackbar.closestTargetTo({x,y}, targets);
        if(closest===null) {
            if(this.state.holding) {
                this.setState({
                    holding: null
                });
            }
        } else {
            let holding = this.state.holding;
            let selection = holding.selection;
            if(holding.closestTarget.id !== closest.id)
                selection = selection.concat(closest);
            if(this.props.onTracking && this.props.onTracking(closest, selection)===false)
                return; // abort if handler returns false
            this.setState({
                holding: {
                    ...holding,
                    selection,
                    closestTarget: closest,
                    radius: closest.radius * 1.08,
                    x, y
                }
            });
        }
    }

    onTouchRelease(ev) {
        if(this.state.holding) {
            let {closestTarget, selection} = this.state.holding;
            this._frameId = null;
            if (closestTarget) {
                this.props.onDropped && this.props.onDropped(closestTarget, selection);
            }
            this.setState({
                holding: null
            });
        }
    }

    onLayout(event) {
        var {x, y, width, height} = event.nativeEvent.layout;
        this.setState({ layout: { x, y, width, height } });
        //console.log("layout", this.layout);
    }

    render() {
        // compute view style
        let viewStyle = this.getContainerStyle();
        let targets = this.resolvePositions();

        if(this.state.holding) {
            let { closestTarget, radius } = this.state.holding;
            targets.push({
                id: 'hotspot',
                y: closestTarget.y,
                radius: radius,
                style: {
                    ...this.props.hotspotStyle,
                    strokeWidth: radius*0.4
                }
            });
        }
        let outline = this.computeOutline(targets);
        let point = this.state.point;
        let layout = this.state.layout;
        //const SVG = Animated.createAnimatedComponent(Svg);
        return (
               <Animated.View
                   style={viewStyle}
                   onLayout={this.onLayout}
                   onStartShouldSetResponder={(ev) => true}
                   // onMoveShouldSetResponder={(ev) => false}
                   onResponderGrant={this.onTouchGrant}
                   // onResponderReject={this.onTouchEvent.bind(this, "onResponderReject")}
                   onResponderMove={this.onTouchMove}
                   onResponderRelease={this.onTouchRelease}
                   // onResponderTerminationRequest={(ev) => true}
                   // onResponderTerminate={this.onTouchEvent.bind(this, "onResponderTerminate")}
               >{ layout && <Svg width="100%" height="100%" viewBox={`${-layout.width/2} 0 ${layout.width} ${layout.height}`} preserveAspectRatio="xMinYMin slice" style={styles.svg}>
                       <G>
                           { this.renderTargets(targets) }
                           { false && outline.anchors && this.renderOutlineAnchors(outline.anchors) }
                           <Path d={this.renderOutline(outline)} {...this.props.outlineStyle} />
                       </G>
                   </Svg> }
               </Animated.View>
            );
    }
}


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems:'center',
        justifyContent:'center',
        width: '100%',
        height: 500,
        borderWidth: 0,
        borderColor:  'yellow',
    },
    svg: {
        borderWidth: 0,
        borderColor:  'red',
        position: 'absolute'
    },
    touchable: {
        borderColor:'rgba(255,255,255,0.8)'
    },
    target: {
        borderWidth: 1
    },
    disable: {
        opacity: 0.35
    },
    icon: {
        textAlign: 'center',
        color: '#ACBDC8',
        fontSize: 28
    },
    value: {
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'HelveticaNeue-Thin',
        fontSize: 12
    },
    subKeys: {
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'HelveticaNeue',
        fontSize: 12
    }
});
