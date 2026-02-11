import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import OtherPagesInc from '@/components/includes/otherPagesInc';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 240;

const TIME_RANGES = ['1D', '1W', '1M', '6M', '1Y', 'MAX'];

const MarketCallDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedRange, setSelectedRange] = useState('1D');

  const stockTitle = (params.title as string) || 'TATA Motors';
  const stockCode = stockTitle.split(' ')[0].toUpperCase();
  const ltp = '₹25,034.50';
  const change = (params.change as string) || '-25.50';
  const changePercent = (params.changePercent as string) || '(0.10%)';
  
  const isPositive = change.includes('+');
  const themeColor = isPositive ? '#22C55E' : '#EF4444'; 
  const chartFillColor = isPositive ? '#22C55E' : '#EF4444';

  const entryPrice = (params.entry as string) || '642.50';
  const stopLoss = (params.stopLoss as string) || '638.00';
  const target1 = (params.target as string) || '648.00';
  
  const target2 = (parseFloat(target1.replace(/,/g, '')) * 1.02).toFixed(2); 

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{stockTitle.charAt(0)}</Text>
          </View>
          
          <View style={styles.titleInfo}>
            <Text style={styles.stockName}>{stockTitle}</Text>
            <Text style={styles.stockSymbol}>{stockCode}</Text>
          </View>
          
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>{ltp}</Text>
            <Text style={[styles.priceChange, { color: themeColor }]}>
              {change} {changePercent}
            </Text>
          </View>
        </View>

        <View style={styles.badgeContainer}>
          <View style={styles.nseBadge}>
            <Text style={styles.nseText}>NSE</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={chartFillColor} stopOpacity="0.2" />
                <Stop offset="1" stopColor={chartFillColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {[0, 1, 2, 3, 4].map((i) => (
              <Line
                key={i}
                x1="0"
                y1={40 + i * 40}
                x2={width}
                y2={40 + i * 40}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
            ))}

            <SvgText x={width - 20} y="45" fontSize="10" fill="#9CA3AF" textAnchor="end">325</SvgText>
            <SvgText x={width - 20} y="85" fontSize="10" fill="#9CA3AF" textAnchor="end">320</SvgText>
            <SvgText x={width - 20} y="125" fontSize="10" fill="#9CA3AF" textAnchor="end">315</SvgText>
            <SvgText x={width - 20} y="165" fontSize="10" fill="#9CA3AF" textAnchor="end">310</SvgText>
            <SvgText x={width - 20} y="205" fontSize="10" fill="#9CA3AF" textAnchor="end">305</SvgText>

            <Path
              d={`M0,160 C30,190 50,160 80,180 C110,190 140,160 170,160 C200,160 220,130 240,150 C260,160 280,110 300,110 C320,110 330,80 350,90 S380,80 400,85`}
              fill="none"
              stroke={themeColor} 
              strokeWidth="2.5"
            />

            <Path
              d={`M0,160 C30,190 50,160 80,180 C110,190 140,160 170,160 C200,160 220,130 240,150 C260,160 280,110 300,110 C320,110 330,80 350,90 S380,80 400,85 L400,220 L0,220 Z`}
              fill="url(#grad)"
            />

            <Circle cx="300" cy="110" r="5" fill={themeColor} stroke="#fff" strokeWidth="2.5" />
          </Svg>

          <View style={[styles.tooltip, { left: width * 0.58, top: 60 }]}>
              <Text style={styles.tooltipPrice}>322.20</Text>
              <Text style={styles.tooltipDate}>25 Sep</Text>
              <Text style={styles.tooltipTime}>14:20</Text>
          </View>

          <View style={styles.xAxisRow}>
            <Text style={styles.axisLabel}>9:30</Text>
            <Text style={styles.axisLabel}>10:00</Text>
            <Text style={styles.axisLabel}>10:30</Text>
            <Text style={styles.axisLabel}>11:00</Text>
            <Text style={styles.axisLabel}>11:30</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today’s low</Text>
            <Text style={styles.statValue}>₹ 25,003.90</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today’s high</Text>
            <Text style={styles.statValue}>₹ 25,092.90</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today’s return</Text>
            <Text style={[styles.statValue, { color: themeColor }]}>-0.04%</Text>
          </View>
        </View>

        <View style={styles.timeSelectorContainer}>
          {TIME_RANGES.map((item) => {
            const isActive = selectedRange === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.timeButton, isActive && styles.timeButtonActive]}
                onPress={() => setSelectedRange(item)}
              >
                <Text style={[styles.timeText, isActive && styles.timeTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.detailsGrid}>
          
          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>
                Entry: <Text style={styles.greenText}>₹{entryPrice}</Text>
              </Text>
            </View>
            <View style={styles.detailColRight}>
              <Text style={styles.detailLabel}>
                Stop-Loss: <Text style={styles.redText}>₹{stopLoss}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>
                Target 1: <Text style={styles.blackText}>₹{target1}</Text>
              </Text>
            </View>
            <View style={styles.detailColRight}>
               <Text style={styles.detailLabel}>
                 Status: <Text style={styles.greenText}>Active</Text>
               </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>
                Target 2: <Text style={styles.blackText}>₹{target2}</Text>
              </Text>
            </View>
            <View style={styles.detailColRight}>
               <Text style={styles.detailLabel}>
                 Updated at: <Text style={styles.blackText}>11:45 AM</Text>
               </Text>
            </View>
          </View>

        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            <Text style={styles.noteBold}>Note:</Text> Trail SL to ₹640 after Target 1 hit.
          </Text>
        </View>
      </ScrollView>
    </OtherPagesInc>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  titleSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  iconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4338CA',
  },
  titleInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockSymbol: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceChange: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeContainer: {
    paddingHorizontal: 16,
    marginBottom: 5,
  },
  nseBadge: {
    backgroundColor: '#005BC1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  nseText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  chartContainer: {
    marginBottom: 24,
    position: 'relative',
    height: CHART_HEIGHT,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 1,
  },
  axisLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
    alignItems: 'flex-start',
  },
  tooltipPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tooltipDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  tooltipTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 28,
    marginTop: 8,

  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  timeButton: {
    width: 44,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  timeButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timeTextActive: {
    color: '#fff',
  },
  detailsGrid: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  detailColRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 40,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  greenText: {
    color: '#22C55E',
    fontWeight: '700',
  },
  redText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  blackText: {
    color: '#334155',
    fontWeight: '600',
  },
  noteContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  noteBold: {
    fontWeight: '800',
    color: '#000',
  },
});

export default MarketCallDetails;