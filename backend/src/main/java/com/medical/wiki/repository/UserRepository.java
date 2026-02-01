package com.medical.wiki.repository;

import com.medical.wiki.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmployeeId(String employeeId);

    List<User> findAllByRoleNot(User.Role role);

    List<User> findAllByDeletedAtIsNull();

    Optional<User> findByEmployeeIdAndDeletedAtIsNull(String employeeId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM users", nativeQuery = true)
    List<User> findAllIncludingDeleted();

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM users WHERE employee_id = :employeeId", nativeQuery = true)
    Optional<User> findByEmployeeIdIncludingDeleted(@Param("employeeId") String employeeId);

    // Compliance export queries
    List<User> findByFacilityAndDeletedAtIsNull(String facility);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.facility FROM User u WHERE u.deletedAt IS NULL ORDER BY u.facility")
    List<String> findDistinctFacilities();

    Optional<User> findByInvitationToken(String invitationToken);
}
