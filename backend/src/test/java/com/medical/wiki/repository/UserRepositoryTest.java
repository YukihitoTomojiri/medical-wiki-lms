package com.medical.wiki.repository;

import com.medical.wiki.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void findByEmployeeId_ShouldReturnUser_WhenNotDeleted() {
        User user = new User();
        user.setEmployeeId("TEST001");
        user.setName("Test User");
        user.setFacility("Hospital A");
        user.setRole(User.Role.USER);
        user.setPassword("password");
        user.setJoinedDate(LocalDate.of(2024, 1, 1));
        user.setDepartment("Dept");
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmployeeId("TEST001");
        assertThat(found).isPresent();
    }

    @Test
    public void findByEmployeeId_ShouldNotReturnUser_WhenDeleted() {
        User user = new User();
        user.setEmployeeId("TEST002");
        user.setName("Deleted User");
        user.setFacility("Hospital A");
        user.setRole(User.Role.USER);
        user.setPassword("password");
        user.setDeletedAt(LocalDateTime.now());
        user.setJoinedDate(LocalDate.of(2024, 1, 1));
        user.setDepartment("Dept");
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmployeeId("TEST002");
        assertThat(found).isEmpty();
    }

    @Test
    public void findByFacility_ShouldExcludeDeletedUsers() {
        User activeUser = new User();
        activeUser.setEmployeeId("TEST003");
        activeUser.setName("Active");
        activeUser.setFacility("Hospital B");
        activeUser.setRole(User.Role.USER);
        activeUser.setPassword("password");
        activeUser.setJoinedDate(LocalDate.of(2024, 1, 1));
        activeUser.setDepartment("Dept");
        userRepository.save(activeUser);

        User deletedUser = new User();
        deletedUser.setEmployeeId("TEST004");
        deletedUser.setName("Deleted");
        deletedUser.setFacility("Hospital B");
        deletedUser.setRole(User.Role.USER);
        deletedUser.setPassword("password");
        deletedUser.setDeletedAt(LocalDateTime.now());
        deletedUser.setJoinedDate(LocalDate.of(2024, 1, 1));
        deletedUser.setDepartment("Dept");
        userRepository.save(deletedUser);

        List<User> users = userRepository.findByFacilityAndDeletedAtIsNull("Hospital B");
        assertThat(users).hasSize(1);
        assertThat(users.get(0).getName()).isEqualTo("Active");
    }
}
