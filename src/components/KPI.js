import React, { Component } from 'react';
import {
    StyleSheet, Dimensions,
    Text, View, Animated
} from 'react-native';
import Svg,{
    Circle, G, Path, Text as SvgText
//    Ellipse,LinearGradient,RadialGradient,Line,Polygon,Polyline,Rect,Symbol,Use,Defs,Stop
} from 'react-native-svg';
import Icon from "react-native-vector-icons/FontAwesome";

const size = 120;


type State = {
    slide: Animated
};

type Props = {
    header?: string,
    footer?: string,
    value?: string | number,
    show?: boolean,
    icon?: string,
    order?: boolean,
    type?: string,
    delay?: number
};

export default class KPI extends Component<Props, State> {
    static defaultProps = {
        order: 0,
        type: 'text',
        delay: 300
    };

    constructor(props) {
        super(props);
        this.state = {
            slide: new Animated.Value(-size)
        };
        if(props.show)
            this.slideIn();
    }

    slideIn() {
        Animated.spring(
            this.state.slide,
            {
                delay: this.props.delay * (this.props.order+1),
                toValue: 0,
                velocity: 1,
                tension: 2,
                friction: 16
            }
        ).start();
    }

    slideOut() {
        Animated.spring(
            this.state.slide,
            {
                delay: this.props.delay * (this.props.order+1),
                toValue: -size,
                velocity: 1,
                tension: 2,
                friction: 16
            }
        ).start();
    }

    componentWillReceiveProps(nextProps: Props) {
        if(nextProps.show !== this.props.show) {
            if(nextProps.show)
                this.slideIn();
            else
                this.slideOut();
        }
    }

    renderTextValue(value: string) {
        return <Text style={styles.value,styles.textValue}>{ value }</Text>;
    }

    static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    static describeArc(x, y, radius, startAngle, endAngle){

        var start = KPI.polarToCartesian(x, y, radius, endAngle);
        var end = KPI.polarToCartesian(x, y, radius, startAngle);

        var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        var d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");

        return d;
    }

    renderPieValue(value: string | number) {
        const rangeMargin = 0;
        let percent = Number(value) / 100;
        if(percent<0) percent = 0; else if(percent>100) percent = 100;
        let arc = KPI.describeArc(-12, -6, 25, rangeMargin/2, rangeMargin/2 + (360-rangeMargin)*percent );
        return <Svg style={styles.value,styles.pieValue} width='100%' height={64} viewBox='-50 -50 100 100' >
            <Path d={arc} fill='transparent' stroke='white' strokeWidth={4} />
        </Svg>;
    }

    render() {
        let { header, footer, value, type, order } = this.props;
        let valueCtrl;
        switch(type) {
            case 'pie': valueCtrl=this.renderPieValue(value); break;
            default: valueCtrl=this.renderTextValue(value); break;
        }
        return (
            <Animated.View style={[styles.container, { top: 210+order*(size-1), right: this.state.slide }]}>
                <Text style={styles.caption}>{ header }</Text>
                { this.props.icon && <Icon name={this.props.icon} style={styles.icon} color='white' /> }
                { valueCtrl }
                <Text style={styles.caption}>{ footer }</Text>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        width: size,
        height: size,
        position: 'absolute',
        padding: 20,
        borderTopColor: 'rgba(255,255,255,0.4)',
        borderTopWidth: 0,
        borderBottomColor: 'rgba(255,255,255,0.4)',
        borderBottomWidth: 0
    },
    caption: {
        fontFamily: 'arial',
        fontSize: 11,
        color: '#777',
        width: '100%',
        textAlign: 'center',
        bottom: 12
    },
    value: {
    },
    textValue: {
        width: '100%',
        height: 64,
        fontSize: 36,
        color: 'white',
        textAlign: 'center',
        textAlignVertical: 'center'
    },
    pieValue: {
    },
    icon: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 36
    }
});