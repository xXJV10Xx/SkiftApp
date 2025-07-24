import { Building2, Mail, MapPin, Phone, User, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DrawerLayout from '../../components/DrawerLayout';
import ProfilePicture from '../../components/ProfilePicture';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadProfileImage } from '../../lib/imageUpload';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { 
    selectedCompany, 
    selectedTeam, 
    selectedDepartment, 
    employee,
    updateEmployeeProfile,
    loading
  } = useCompany();
  
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(employee?.first_name || '');
  const [lastName, setLastName] = useState(employee?.last_name || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [position, setPosition] = useState(employee?.position || '');
  const [profileImageUri, setProfileImageUri] = useState(employee?.avatar_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSave = async () => {
    try {
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        position: position
      };

      // Include avatar_url if it has changed
      if (profileImageUri !== employee?.avatar_url) {
        updateData.avatar_url = profileImageUri;
      }

      await updateEmployeeProfile(updateData);
      
      setEditing(false);
      Alert.alert('Framgång', 'Profilen har uppdaterats');
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte uppdatera profilen');
    }
  };

  const handleImageSelected = async (imageUri: string) => {
    if (!user) return;

    try {
      setUploadingImage(true);
      
      const uploadedImageUrl = await uploadProfileImage(user.id, imageUri);
      
      if (uploadedImageUrl) {
        setProfileImageUri(uploadedImageUrl);
        
        // Auto-save the profile image
        await updateEmployeeProfile({
          avatar_url: uploadedImageUrl
        });
        
        Alert.alert('Framgång', 'Profilbilden har uppdaterats');
      } else {
        Alert.alert('Fel', 'Kunde inte ladda upp bilden');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Fel', 'Kunde inte ladda upp bilden');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Logga ut',
      'Är du säker på att du vill logga ut?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Logga ut',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.card,
      padding: 20,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    uploadingText: {
      fontSize: 14,
      color: colors.primary,
      marginTop: 8,
      fontStyle: 'italic',
    },
    section: {
      backgroundColor: colors.card,
      marginTop: 20,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginVertical: 16,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoIcon: {
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 16,
      color: colors.text,
    },
    input: {
      fontSize: 16,
      color: colors.text,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
      paddingVertical: 4,
    },
    editButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      margin: 20,
    },
    editButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      margin: 20,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: colors.textSecondary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 20,
    },
    cancelButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error,
      marginTop: 20,
      marginHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
    },
    signOutText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      marginLeft: 8,
    },
    teamBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 4,
    },
    teamColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    teamText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
  });

  return (
    <DrawerLayout title="Profil">
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ProfilePicture
          imageUri={profileImageUri}
          size={80}
          onImageSelected={handleImageSelected}
          editable={!uploadingImage}
        />
        <Text style={styles.name}>
          {employee?.first_name} {employee?.last_name}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        {uploadingImage && (
          <Text style={styles.uploadingText}>Laddar upp bild...</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personlig information</Text>
        
        <View style={styles.infoItem}>
          <User size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Förnamn</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Förnamn"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.infoValue}>{employee?.first_name || 'Ej angivet'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <User size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Efternamn</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Efternamn"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.infoValue}>{employee?.last_name || 'Ej angivet'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <Mail size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>E-post</Text>
            <Text style={styles.infoValue}>{employee?.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Phone size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Telefon</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Telefonnummer"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{employee?.phone || 'Ej angivet'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <MapPin size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Position</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="Befattning/Position"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.infoValue}>{employee?.position || 'Ej angivet'}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Arbetsplats</Text>
        
        <View style={styles.infoItem}>
          <Building2 size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Företag</Text>
            <Text style={styles.infoValue}>
              {selectedCompany?.name || 'Ej valt'}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Users size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Skiftlag</Text>
            {selectedTeam && selectedCompany ? (
              <View style={styles.teamBadge}>
                <View 
                  style={[
                    styles.teamColor, 
                    { backgroundColor: selectedCompany.colors[selectedTeam] }
                  ]} 
                />
                <Text style={styles.teamText}>Lag {selectedTeam}</Text>
              </View>
            ) : (
              <Text style={styles.infoValue}>Ej valt</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <MapPin size={20} color={colors.textSecondary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Avdelning</Text>
            <Text style={styles.infoValue}>
              {selectedDepartment || 'Ej valt'}
            </Text>
          </View>
        </View>
      </View>

      {editing ? (
        <>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Sparar...' : 'Spara ändringar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setEditing(false)}
          >
            <Text style={styles.cancelButtonText}>Avbryt</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
          <Text style={styles.editButtonText}>Redigera profil</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Logga ut</Text>
      </TouchableOpacity>
    </ScrollView>
    </DrawerLayout>
  );
}