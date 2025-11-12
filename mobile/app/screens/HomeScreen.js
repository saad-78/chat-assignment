import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsersStart, fetchUsersSuccess, fetchUsersFailure, updateUserStatus } from '../store/slices/userSlice';
import { logout } from '../store/slices/authSlice';
import { fetchUsers } from '../api/userService';
import { initSocket, getSocket, disconnectSocket } from '../sockets/socket';
import { useFocusEffect } from '@react-navigation/native'; // ADD THIS

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.user);
  const { token, user } = useSelector((state) => state.auth);

  // Initial load
  useEffect(() => {
    loadUsers();
    setupSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  // Refresh when screen comes into focus (after registration)
  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    dispatch(fetchUsersStart());
    try {
      const data = await fetchUsers(token);
      dispatch(fetchUsersSuccess(data));
    } catch (err) {
      dispatch(fetchUsersFailure(err.message));
    }
  };

  const setupSocket = () => {
    const socket = initSocket(token);

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('user:online', (data) => {
      dispatch(updateUserStatus({ userId: data.userId, isOnline: true }));
    });

    socket.on('user:offline', (data) => {
      dispatch(updateUserStatus({ userId: data.userId, isOnline: false }));
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  };

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('Chat', { 
        userId: item._id, 
        username: item.username 
      })}
    >
      <View style={styles.userInfo}>
        <View style={[styles.avatar, item.isOnline && styles.onlineAvatar]}>
          <Text style={styles.avatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.status}>
            {item.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>
      {item.isOnline && <View style={styles.onlineDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 10,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  onlineAvatar: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },
});
