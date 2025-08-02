import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, type SubscriptionPlan } from '../lib/stripe';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
  disabled?: boolean;
}

export default function SubscriptionPlanCard({
  plan,
  isSelected = false,
  isCurrentPlan = false,
  onSelect,
  disabled = false,
}: SubscriptionPlanCardProps) {
  const handleSelect = () => {
    if (!disabled && !isCurrentPlan) {
      onSelect(plan.id);
    }
  };

  const getPopularBadge = () => {
    if (plan.id === 'professional') {
      return (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULÄR</Text>
        </View>
      );
    }
    return null;
  };

  const getPlanColor = () => {
    switch (plan.id) {
      case 'starter':
        return '#4CAF50';
      case 'professional':
        return '#2196F3';
      case 'enterprise':
        return '#9C27B0';
      default:
        return '#007AFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        isCurrentPlan && styles.currentPlanContainer,
        disabled && styles.disabledContainer,
      ]}
      onPress={handleSelect}
      disabled={disabled || isCurrentPlan}
      activeOpacity={0.8}
    >
      {getPopularBadge()}
      
      <View style={styles.header}>
        <Text style={[styles.planName, { color: getPlanColor() }]}>
          {plan.name}
        </Text>
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>AKTIV</Text>
          </View>
        )}
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          {formatCurrency(plan.price, plan.currency)}
        </Text>
        <Text style={styles.billingPeriod}>
          /{plan.billingPeriod === 'monthly' ? 'månad' : 'år'}
        </Text>
      </View>

      <View style={styles.employeeLimit}>
        <Ionicons name="people" size={16} color="#666" />
        <Text style={styles.employeeLimitText}>
          {plan.employeeLimit === -1 
            ? 'Obegränsat antal anställda' 
            : `Upp till ${plan.employeeLimit} anställda`
          }
        </Text>
      </View>

      <ScrollView style={styles.featuresContainer} showsVerticalScrollIndicator={false}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={getPlanColor()} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </ScrollView>

      {isSelected && !isCurrentPlan && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          <Text style={styles.selectedText}>Vald</Text>
        </View>
      )}

      {isCurrentPlan && (
        <View style={styles.currentIndicator}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.currentIndicatorText}>Nuvarande plan</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 320,
    position: 'relative',
  },
  selectedContainer: {
    borderColor: '#007AFF',
    backgroundColor: '#F8FBFF',
  },
  currentPlanContainer: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  disabledContainer: {
    opacity: 0.6,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  billingPeriod: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  employeeLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  employeeLimitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  featuresContainer: {
    flex: 1,
    maxHeight: 120,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  selectedText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  currentIndicatorText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
});