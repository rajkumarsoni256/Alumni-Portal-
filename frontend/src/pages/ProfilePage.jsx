import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { profileService } from '../services/profileService';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileAboutSection } from '../components/profile/ProfileAboutSection';
import { ProfileExperienceSection } from '../components/profile/ProfileExperienceSection';
import { ProfileEducationSection } from '../components/profile/ProfileEducationSection';
import { ProfileSkillsSection } from '../components/profile/ProfileSkillsSection';
import { ProfileProjectsSection } from '../components/profile/ProfileProjectsSection';
import { ProfileAchievementsSection } from '../components/profile/ProfileAchievementsSection';
import { ProfilePostsSection } from '../components/profile/ProfilePostsSection';
import { 
  EditBasicInfoModal, 
  ExperienceModal, 
  EducationModal, 
  ProjectModal 
} from '../components/profile/ProfileModals';
import { ProfileSkeleton, ProfileNotFound } from '../components/profile/ProfileStates';

export const ProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { 
    currentUser, 
    usersMap, 
    posts, 
    updateUserProfile, 
    addUserSkill, 
    removeUserSkill,
    showNotification 
  } = useApp();

  // Determine target User ID
  const effectiveUserId = useMemo(() => {
    if (!id || id === 'me') return currentUser?.id || 'me';
    return id;
  }, [id, currentUser]);

  const isOwnProfile = Boolean(
    id === 'me' || 
    effectiveUserId === 'me' ||
    effectiveUserId === currentUser?.id
  );

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // Modals state
  const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false);
  const [experienceModalState, setExperienceModalState] = useState({ isOpen: false, data: null });
  const [educationModalState, setEducationModalState] = useState({ isOpen: false, data: null });
  const [projectModalState, setProjectModalState] = useState({ isOpen: false, data: null });

  // Load profile data
  const loadProfile = async () => {
    setIsLoading(true);
    setIsNotFound(false);

    try {
      if (isOwnProfile) {
        const data = await profileService.getCurrentProfile();
        if (data) {
          setProfile({ ...currentUser, ...data });
        } else {
          setProfile(currentUser);
        }
      } else {
        const data = await profileService.getProfileById(effectiveUserId);
        if (!data) {
          setIsNotFound(true);
        } else {
          const synced = usersMap[effectiveUserId]
            ? { ...data, ...usersMap[effectiveUserId] }
            : data;
          setProfile(synced);
        }
      }
    } catch (err) {
      if (isOwnProfile && currentUser) {
        setProfile(currentUser);
      } else {
        setIsNotFound(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [effectiveUserId, isOwnProfile, currentUser, usersMap]);

  // Handlers for profile mutations
  const handleSaveBasicInfo = async (updatedFields) => {
    await profileService.updateBasicInfo(effectiveUserId, updatedFields);
    updateUserProfile(effectiveUserId, updatedFields);
    setProfile((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleSaveAbout = async (newAboutText) => {
    await profileService.updateAbout(effectiveUserId, newAboutText);
    setProfile((prev) => ({ ...prev, about: newAboutText }));
    showNotification('About section updated', 'success');
  };

  // Experience handlers
  const handleSaveExperience = async (expData) => {
    if (experienceModalState.data) {
      await profileService.updateExperience(effectiveUserId, experienceModalState.data.id, expData);
      setProfile((prev) => ({
        ...prev,
        experience: (prev.experience || []).map((e) =>
          e.id === experienceModalState.data.id ? { ...e, ...expData } : e
        ),
      }));
      showNotification('Experience updated', 'success');
    } else {
      const created = await profileService.addExperience(effectiveUserId, expData);
      setProfile((prev) => ({
        ...prev,
        experience: [created, ...(prev.experience || [])],
      }));
      showNotification('Experience added', 'success');
    }
  };

  const handleDeleteExperience = async (expId) => {
    await profileService.deleteExperience(effectiveUserId, expId);
    setProfile((prev) => ({
      ...prev,
      experience: (prev.experience || []).filter((e) => e.id !== expId),
    }));
    showNotification('Experience removed', 'info');
  };

  // Education handlers
  const handleSaveEducation = async (eduData) => {
    if (educationModalState.data) {
      await profileService.updateEducation(effectiveUserId, educationModalState.data.id, eduData);
      setProfile((prev) => ({
        ...prev,
        education: (prev.education || []).map((e) =>
          e.id === educationModalState.data.id ? { ...e, ...eduData } : e
        ),
      }));
      showNotification('Education updated', 'success');
    } else {
      const created = await profileService.addEducation(effectiveUserId, eduData);
      setProfile((prev) => ({
        ...prev,
        education: [created, ...(prev.education || [])],
      }));
      showNotification('Education added', 'success');
    }
  };

  const handleDeleteEducation = async (eduId) => {
    await profileService.deleteEducation(effectiveUserId, eduId);
    setProfile((prev) => ({
      ...prev,
      education: (prev.education || []).filter((e) => e.id !== eduId),
    }));
    showNotification('Education removed', 'info');
  };

  // Projects handlers
  const handleSaveProject = async (projData) => {
    if (projectModalState.data) {
      await profileService.updateProject(effectiveUserId, projectModalState.data.id, projData);
      setProfile((prev) => ({
        ...prev,
        projects: (prev.projects || []).map((p) =>
          p.id === projectModalState.data.id ? { ...p, ...projData } : p
        ),
      }));
      showNotification('Project updated', 'success');
    } else {
      const created = await profileService.addProject(effectiveUserId, projData);
      setProfile((prev) => ({
        ...prev,
        projects: [created, ...(prev.projects || [])],
      }));
      showNotification('Project added', 'success');
    }
  };

  const handleDeleteProject = async (projId) => {
    await profileService.deleteProject(effectiveUserId, projId);
    setProfile((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((p) => p.id !== projId),
    }));
    showNotification('Project removed', 'info');
  };

  // Skills handlers
  const handleAddSkill = async (skillName) => {
    const updatedSkills = await profileService.addSkill(effectiveUserId, skillName);
    addUserSkill(effectiveUserId, skillName);
    setProfile((prev) => ({ ...prev, skills: updatedSkills }));
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = await profileService.removeSkill(effectiveUserId, skillToRemove);
    removeUserSkill(effectiveUserId, skillToRemove);
    setProfile((prev) => ({ ...prev, skills: updatedSkills }));
  };

  // Filter posts authored by this user
  const userPosts = useMemo(() => {
    if (!profile) return [];
    return posts.filter((p) => p.authorId === profile.id);
  }, [posts, profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/75 py-5 px-3 sm:px-4 lg:px-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (isNotFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-100/75 py-5 px-3 sm:px-4 lg:px-6">
        <ProfileNotFound />
      </div>
    );
  }

  const isStudent = !profile.isAlumni && profile.role?.toLowerCase() !== 'alumni';

  const handleUpdateAvatar = async (newAvatarUrl) => {
    await updateUserProfile({ avatarUrl: newAvatarUrl, avatar: newAvatarUrl });
    setProfile((prev) => ({
      ...prev,
      avatarUrl: newAvatarUrl,
      avatar: newAvatarUrl,
    }));
  };

  const handleUpdateBanner = async (newBannerUrl) => {
    await updateUserProfile({ bannerUrl: newBannerUrl, banner: newBannerUrl, coverImage: newBannerUrl });
    setProfile((prev) => ({
      ...prev,
      bannerUrl: newBannerUrl,
      banner: newBannerUrl,
      coverImage: newBannerUrl,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* 1. Profile Header */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setIsBasicInfoModalOpen(true)}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateBanner={handleUpdateBanner}
        />

        {/* 2. Role-Aware Profile Sections Hierarchy */}
        {isStudent ? (
          /* Student Hierarchy: About -> Education -> Skills -> Projects -> Experience -> Achievements -> Posts */
          <>
            <ProfileAboutSection
              about={profile.about}
              isOwnProfile={isOwnProfile}
              onSaveAbout={handleSaveAbout}
            />

            <ProfileEducationSection
              education={profile.education}
              isOwnProfile={isOwnProfile}
              onAddClick={() => setEducationModalState({ isOpen: true, data: null })}
              onEditClick={(edu) => setEducationModalState({ isOpen: true, data: edu })}
              onDeleteClick={handleDeleteEducation}
            />

            <ProfileSkillsSection
              skills={profile.skills}
              isOwnProfile={isOwnProfile}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
            />

            <ProfileProjectsSection
              projects={profile.projects}
              isOwnProfile={isOwnProfile}
              onAddClick={() => setProjectModalState({ isOpen: true, data: null })}
              onEditClick={(proj) => setProjectModalState({ isOpen: true, data: proj })}
              onDeleteClick={handleDeleteProject}
            />

            <ProfileExperienceSection
              experience={profile.experience}
              isOwnProfile={isOwnProfile}
              onAddClick={() => setExperienceModalState({ isOpen: true, data: null })}
              onEditClick={(exp) => setExperienceModalState({ isOpen: true, data: exp })}
              onDeleteClick={handleDeleteExperience}
            />

            <ProfileAchievementsSection
              achievements={profile.achievements}
            />

            <ProfilePostsSection
              posts={userPosts}
              authorName={profile.name}
            />
          </>
        ) : (
          /* Alumni Hierarchy: About -> Experience -> Education -> Skills -> Projects -> Achievements -> Posts */
          <>
            <ProfileAboutSection
              about={profile.about}
              isOwnProfile={isOwnProfile}
              onSaveAbout={handleSaveAbout}
            />

            <ProfileExperienceSection
              experience={profile.experience}
              isOwnProfile={isOwnProfile}
              onAddClick={() => setExperienceModalState({ isOpen: true, data: null })}
              onEditClick={(exp) => setExperienceModalState({ isOpen: true, data: exp })}
              onDeleteClick={handleDeleteExperience}
            />

            <ProfileEducationSection
              education={profile.education}
              isOwnProfile={isOwnProfile}
              onAddClick={() => setEducationModalState({ isOpen: true, data: null })}
              onEditClick={(edu) => setEducationModalState({ isOpen: true, data: edu })}
              onDeleteClick={handleDeleteEducation}
            />

            <ProfileSkillsSection
              skills={profile.skills}
              isOwnProfile={isOwnProfile}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
            />

            <ProfileProjectsSection
              projects={profile.projects}
              isOwnProfile={isOwnProfile}
              onAddClick={() => setProjectModalState({ isOpen: true, data: null })}
              onEditClick={(proj) => setProjectModalState({ isOpen: true, data: proj })}
              onDeleteClick={handleDeleteProject}
            />

            <ProfileAchievementsSection
              achievements={profile.achievements}
            />

            <ProfilePostsSection
              posts={userPosts}
              authorName={profile.name}
            />
          </>
        )}

      </div>

      {/* Editing Modals */}
      <EditBasicInfoModal
        isOpen={isBasicInfoModalOpen}
        onClose={() => setIsBasicInfoModalOpen(false)}
        initialData={profile}
        onSave={handleSaveBasicInfo}
      />

      <ExperienceModal
        isOpen={experienceModalState.isOpen}
        onClose={() => setExperienceModalState({ isOpen: false, data: null })}
        initialData={experienceModalState.data}
        onSave={handleSaveExperience}
      />

      <EducationModal
        isOpen={educationModalState.isOpen}
        onClose={() => setEducationModalState({ isOpen: false, data: null })}
        initialData={educationModalState.data}
        onSave={handleSaveEducation}
      />

      <ProjectModal
        isOpen={projectModalState.isOpen}
        onClose={() => setProjectModalState({ isOpen: false, data: null })}
        initialData={projectModalState.data}
        onSave={handleSaveProject}
      />

    </div>
  );
};
