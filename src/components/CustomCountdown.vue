<template>

  <!--
    组件的根容器。
    - .custom-countdown: 标识这是一个自定义倒计时组件，用于特定样式作用域。
    - .card: 应用在 `global.css` 中定义的通用卡片样式，提供统一的背景、圆角和阴影。
  -->
  <div
    class="custom-countdown card"
  >

    <!--
      头部区域容器。
      - .custom-countdown-header: 专门用于头部区域的样式。
      - .three-column-header: 应用三栏网格布局的特定样式类。
    -->
    <div
      class="custom-countdown-header three-column-header"
    >
      <!--
        头部左侧区域容器。
        - .header-zone-left: Grid布局中的第一列，内容将靠左对齐。
      -->
      <div
        class="header-zone-left"
      >
        <!--
          模块标题。
          - .title: 应用标题的特定样式。
          - 内容 "自定义倒计时" 硬编码为该模块的名称。
        -->
        <h3
          class="title"
        >
          自定义倒计时
        </h3>
      </div>
      
      <!--
        头部中间区域容器。
        - .header-zone-center: Grid布局中的第二列，内容将水平居中。
      -->
      <div
        class="header-zone-center"
      >
        <!--
          "添加倒计时" 按钮。
          - .button, .button-primary, .add-new-event-btn: 应用通用按钮、主色按钮和特定功能按钮的样式。
          - @click="openAddModal": 点击时调用 `openAddModal` 方法来打开添加/编辑弹窗。
        -->
        <button
          class="button button-primary add-new-event-btn"
          @click="openAddModal"
        >
          添加倒计时
        </button>
      </div>

      <!--
        头部右侧功能按钮容器。
        - .header-actions: 用于包裹所有右侧操作按钮，并应用Flex布局。
        - .header-zone-right: Grid布局中的第三列，内容将靠右对齐。
      -->
      <div
        class="header-actions header-zone-right"
      >
        <!--
          批量删除按钮。
          - v-if: 仅在 `isMultiSelectMode` 为真 (多选模式) 且 `selectedEventIds.size` 大于0 (有选中项) 时才渲染此按钮。
          - .button, .button-danger, .bulk-delete-btn: 应用通用按钮、危险操作按钮和特定功能按钮的样式。
          - @click="bulkDelete": 点击时调用 `bulkDelete` 方法执行批量删除。
          - :title: 鼠标悬停时显示的提示文本，动态显示选中的项目数量。
        -->
        <button
          v-if="isMultiSelectMode && selectedEventIds.size > 0"
          class="button button-danger bulk-delete-btn"
          @click="bulkDelete"
          :title="`删除选中的 ${selectedEventIds.size} 个项目`"
        >
          <!--
            删除图标 (垃圾桶)。
            - 这是一个内联SVG，用于显示图标，比图片格式更轻量且可定制。
          -->
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          批量删除
        </button>

        <!--
          排序和多选按钮的连体按钮组。
          - .joined-btn-group: 应用连体按钮组的样式，使内部按钮边框合并。
        -->
        <div
          class="joined-btn-group"
        >
          <!--
            合并后的单个排序按钮。
            - .joined-btn, .action-btn: 应用连体按钮和操作按钮的样式。
            - @click="cycleSortOrder": 点击时调用 `cycleSortOrder` 方法在不同排序模式间循环切换。
            - :title: 动态显示当前排序模式的提示文本。
          -->
          <button
            class="joined-btn action-btn"
            :class="{ active: sortOrder !== 'manual' }"
            @click="cycleSortOrder"
            :title="`当前排序: ${sortOrder === 'manual' ? '手动' : (sortOrder === 'asc' ? '升序' : '降序')}`"
          >
            <!--
              手动/默认排序图标 (列表)。
              - v-if: 当 `sortOrder` 为 'manual' 时显示此SVG。
            -->
            <svg
              v-if="sortOrder === 'manual'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            > 
              <!-- 左侧向上箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="9" y1="3" x2="9" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 左斜线 -->
                <line x1="9" y1="3" x2="4" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
              
              <!-- 右侧向下箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="15" y1="3" x2="15" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 右斜线 -->
                <line x1="20" y1="14" x2="15" y2="21" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <!--
              升序图标 (向上箭头)。
              - v-else-if: 当 `sortOrder` 为 'asc' 时显示此SVG。
            -->
            <svg
              v-else-if="sortOrder === 'asc'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- 左侧向上箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="9" y1="1" x2="9" y2="23" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
                <!-- 左斜线 -->
                <line x1="9" y1="1" x2="4" y2="10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
              
              <!-- 右侧向下箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="15" y1="3" x2="15" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 右斜线 -->
                <line x1="20" y1="14" x2="15" y2="21" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <!--
              降序图标 (向下箭头)。
              - v-else: 当以上条件都不满足 (即 `sortOrder` 为 'desc') 时显示此SVG。
            -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- 左侧向上箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="9" y1="3" x2="9" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 左斜线 -->
                <line x1="9" y1="3" x2="4" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
              
              <!-- 右侧向下箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="15" y1="1" x2="15" y2="23" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
                <!-- 右斜线 -->
                <line x1="20" y1="14" x2="15" y2="23" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </button>
          
          <!--
            多选切换按钮。
            - .joined-btn, .action-btn: 应用连体和操作按钮样式。
            - :class="{ active: isMultiSelectMode }": 当 `isMultiSelectMode` 为真时，动态添加 'active' 类以高亮按钮。
            - @click="toggleMultiSelectMode": 点击时调用 `toggleMultiSelectMode` 方法切换多选模式。
            - title: 鼠标悬停时的提示文本。
          -->
          <button
            class="joined-btn action-btn"
            :class="{ active: isMultiSelectMode }"
            @click="toggleMultiSelectMode"
            title="切换多选模式"
          >
            <!-- 复选框打勾图标SVG -->
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!--
      事件编辑/添加弹窗的遮罩层。
      - v-if="isModalOpen": 当 `isModalOpen` 状态为真时，渲染此弹窗。
      - .modal-overlay: 定义了全屏、半透明的遮罩层样式。
      - @click.self="closeModal": `.self` 修饰符确保只有在直接点击遮罩层本身时才调用 `closeModal` 方法，点击其子元素（弹窗内容）时不会触发。
    -->
    <div
      v-if="isModalOpen"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <!--
        弹窗内容容器。
        - .modal-content: 定义了弹窗的背景、尺寸、边距等样式。
        - @click.stop: 阻止点击事件继续向上传播（冒泡），防止触发遮罩层的关闭事件。
      -->
      <div
        class="modal-content"
        @click.stop
      >
        <!--
          弹窗标题。
          - .modal-title: 标题的特定样式。
          - {{ modalTitle }}: 动态绑定 `modalTitle` ref 的值，显示 "添加..." 或 "编辑..."。
        -->
        <h3
          class="modal-title"
        >
          {{ modalTitle }}
        </h3>

        <!-- 统一的表单输入区域 -->
        <div
          class="modal-form"
        >
          <!-- 年月日输入组 -->
          <div
            class="input-group"
          >
            <!--
              年份输入框。
              - ref="formYearRef": 将此DOM元素注册为 `formYearRef` 引用。
              - v-model="eventForm.year": 双向绑定到 `eventForm.year` 状态。
              - @...: 绑定了一系列事件处理器，用于输入验证、导航、滚轮调整等交互。
            -->
            <input
              ref="formYearRef"
              v-model="eventForm.year"
              type="text"
              class="input"
              placeholder="年"
              @input="formInteractionHandler.onInput($event, 'year')"
              @keydown="formInteractionHandler.onKeydown($event, 'year')"
              @focus="formInteractionHandler.onFocus($event, 'year')"
              @blur="formInteractionHandler.onBlur('year')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'year')"
            >
            <!-- 日期格式分隔符 -->
            <span
              class="date-separator"
            >
              -
            </span>
            <!-- 月份输入框，逻辑同上 -->
            <input
              ref="formMonthRef"
              v-model="eventForm.month"
              type="text"
              class="input"
              placeholder="月"
              @input="formInteractionHandler.onInput($event, 'month')"
              @keydown="formInteractionHandler.onKeydown($event, 'month')"
              @focus="formInteractionHandler.onFocus($event, 'month')"
              @blur="formInteractionHandler.onBlur('month')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'month')"
            >
            <!-- 日期格式分隔符 -->
            <span
              class="date-separator"
            >
              -
            </span>
            <!-- 日期输入框，逻辑同上 -->
            <input
              ref="formDayRef"
              v-model="eventForm.day"
              type="text"
              class="input"
              placeholder="日"
              @input="formInteractionHandler.onInput($event, 'day')"
              @keydown="formInteractionHandler.onKeydown($event, 'day')"
              @focus="formInteractionHandler.onFocus($event, 'day')"
              @blur="formInteractionHandler.onBlur('day')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'day')"
            >
          </div>

          <!-- 时分秒输入组 -->
          <div
            class="input-group"
          >
            <!-- 小时输入框，逻辑同上 -->
            <input
              ref="formHourRef"
              v-model="eventForm.hour"
              type="text"
              class="input"
              placeholder="时"
              @input="formInteractionHandler.onInput($event, 'hour')"
              @keydown="formInteractionHandler.onKeydown($event, 'hour')"
              @focus="formInteractionHandler.onFocus($event, 'hour')"
              @blur="formInteractionHandler.onBlur('hour')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'hour')"
            >
            <!-- 时间格式分隔符 -->
            <span
              class="date-separator"
            >
              :
            </span>
            <!-- 分钟输入框，逻辑同上 -->
            <input
              ref="formMinuteRef"
              v-model="eventForm.minute"
              type="text"
              class="input"
              placeholder="分"
              @input="formInteractionHandler.onInput($event, 'minute')"
              @keydown="formInteractionHandler.onKeydown($event, 'minute')"
              @focus="formInteractionHandler.onFocus($event, 'minute')"
              @blur="formInteractionHandler.onBlur('minute')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'minute')"
            >
            <!-- 时间格式分隔符 -->
            <span
              class="date-separator"
            >
              :
            </span>
            <!-- 秒数输入框，逻辑同上 -->
            <input
              ref="formSecondRef"
              v-model="eventForm.second"
              type="text"
              class="input"
              placeholder="秒"
              @input="formInteractionHandler.onInput($event, 'second')"
              @keydown="formInteractionHandler.onKeydown($event, 'second')"
              @focus="formInteractionHandler.onFocus($event, 'second')"
              @blur="formInteractionHandler.onBlur('second')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'second')"
            >
          </div>

          <!-- 事件名称输入框，逻辑同上 -->
          <input
            ref="formNameRef"
            v-model="eventForm.name"
            type="text"
            class="input event-name-input"
            placeholder="事件名称（可选）"
            @keydown="formInteractionHandler.onKeydown($event, 'name')"
            @focus="formInteractionHandler.onFocus($event, 'name')"
            @blur="formInteractionHandler.onBlur('name')"
          >
        </div>

        <!-- 弹窗操作按钮区域 -->
        <div
          class="modal-actions"
        >
          <!--
            取消按钮。
            - @click="closeModal": 点击时调用 `closeModal` 方法关闭弹窗。
          -->
          <button 
            class="button button-secondary" 
            @click="closeModal"
          >
            取消
          </button>
          <!--
            保存按钮。
            - @click="saveEvent": 点击时调用 `saveEvent` 方法保存事件。
            - :disabled="!isFormValid": 动态绑定 disabled 属性。当 `isFormValid` 计算属性为 false 时，禁用此按钮。
          -->
          <button
            class="button button-primary"
            @click="saveEvent"
            :disabled="!isFormValid"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!--
      事件列表容器。
      - ref="eventsListRef": 将此DOM元素注册为 `eventsListRef` 引用，用于初始化 Sortable.js 实现拖拽排序。
    -->
    <div
      class="events-list"
      ref="eventsListRef"
    >
      <!--
        事件列表渲染循环。
        - v-for: 遍历 `events` 数组，为每个 `event` 对象创建一个 `div.event-container`。
        - :key="event.id": 为每个循环项提供唯一的、稳定的键，对性能优化和DOM复用至关重要。
      -->
      <div
        v-for="event in events"
        :key="event.id"
        :ref="el => eventItemRefs[event.id] = el"
        class="event-container"
        :class="{
          'pending-copy': pendingCopyId === event.id,
          'pending-delete': pendingDeleteId === event.id,
          'is-selected': isMultiSelectMode && selectedEventIds.has(event.id),
          'menu-is-active': activeMenu === event.id
        }"
        @click="handleItemClick(event)"
        @mouseenter="handleEventMouseEnter(event.id)"
        @mouseleave="handleEventMouseLeave"
        @mousemove="handleEventMouseMove"
      >
        <!--
          :ref="el => eventItemRefs[event.id] = el"
          为每个事件容器绑定一个ref，存储到 `eventItemRefs` 对象中，键为事件ID。
          这对于框选功能计算每个条目的位置是必需的。
        -->
        <!--
          类名动态绑定。
          - 'pending-copy': 当 `pendingCopyId` 等于当前事件ID时，应用等待复制的脉冲动画样式。
          - 'pending-delete': 当 `pendingDeleteId` 等于当前事件ID时，应用等待删除的脉冲动画样式。
          - 'is-selected': 当处于多选模式且当前事件ID在 `selectedEventIds` 集合中时，应用选中样式。
        -->
        <!--
          事件监听器。
          - @click="handleItemClick(event)": 在多选模式下处理点击事件，切换选中状态。
          - @mouseenter, @mouseleave, @mousemove: 处理鼠标悬停、离开和移动事件，用于显示快捷键提示浮层。
        -->
        
        <!-- 桌面端左侧拖拽手柄 -->
        <div 
          class="drag-handle drag-handle-left desktop-only" 
          title="拖动排序"
        >
          <!-- 手柄图标SVG -->
          <svg width="10" height="24" fill="currentColor">
            <circle cx="8" cy="6" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/>
            <circle cx="8" cy="18" r="1.5"/>
          </svg>
        </div>
        <!-- 桌面端右侧拖拽手柄 -->
        <div 
          class="drag-handle drag-handle-right desktop-only" 
          title="拖动排序"
        >
          <!-- 手柄图标SVG -->
          <svg width="10" height="24" fill="currentColor">
            <circle cx="2" cy="6" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/>
            <circle cx="2" cy="18" r="1.5"/>
          </svg>
        </div>

        <!-- 事件条目内容 -->
        <div
          class="event-item"
        >
          <!-- 移动端全区域拖拽手柄 -->
          <div 
            class="drag-blank-area mobile-only" 
            title="拖动排序"
          ></div>

          <!-- 事件名称显示 -->
          <div
            class="event-name-column"
          >
            {{ event.name }}
          </div>

          <!--
            事件日期时间显示。
            - :ref: 将DOM元素注册到 `elementRefs` 中，用于字体自适应计算。
            - :style: 动态绑定 `fontStyles` 对象中对应事件ID的字体样式。
            - {{ event.dateTimeDesc }}: 显示格式化后的日期时间描述。
          -->
          <div
            class="event-date-column"
            :ref="el => setElementRef(el, event.id, 'date')"
            :style="fontStyles[event.id]?.date"
          >
            {{ event.dateTimeDesc }}
          </div>

          <!--
            倒计时显示。
            - :ref, :style: 逻辑同上，用于字体自适应。
            - v-html="event.finalDisplay": 使用 `v-html` 渲染包含HTML标签（如 `<span>`）的倒计时文本。
          -->
          <div
            class="event-countdown-column"
            :ref="el => setElementRef(el, event.id, 'countdown')"
            :style="fontStyles[event.id]?.countdown"
          >
            <span
              v-html="event.finalDisplay"
            ></span>
          </div>

          <!--
            【修改】全新的三点菜单容器，整合了单位、精度和操作。
            - @click.stop 阻止事件冒泡。
          -->
          <div
            class="settings-menu-container"
            @click.stop
          >
            <!--
              【修改】菜单触发按钮（三个点）。
              - @click="toggleMenu(event.id)": 点击时调用 `toggleMenu` 方法，传入当前事件ID以打开或关闭对应菜单。
              - :class="{ active: activeMenu === event.id }": 当菜单打开时，高亮按钮。
            -->
            <button 
              class="menu-trigger-btn" 
              @click="toggleMenu(event.id)"
              :class="{ active: activeMenu === event.id }"
            >
              ⋮
            </button>
            <!--
              【修改】全新的下拉菜单面板。
              - v-if="activeMenu === event.id": 只有当 `activeMenu` 的值等于当前事件的ID时，才渲染此菜单。
            -->
            <div 
              v-if="activeMenu === event.id" 
              class="settings-dropdown-panel"
            >
              <!--
                【新增】第一列：单位选项。
              -->
              <div class="dropdown-column">
                <!-- 循环渲染单位按钮 -->
                <button
                  v-for="unit in unitOptions"
                  :key="unit.value"
                  :class="['menu-option-btn', { active: event.unit === unit.value }]"
                  @click="handleUnitChange(event.id, unit.value)"
                >
                  {{ unit.label }}
                </button>
              </div>
              
              <!--
                【新增】第二列：精度选项。
              -->
              <div class="dropdown-column">
                <!-- 循环渲染精度按钮 -->
                <button
                  v-for="p in precisionOptions"
                  :key="p.value"
                  :class="['menu-option-btn', {
                    active: event.decimalPrecision === p.value,
                    disabled: isDecimalDisabled(event.unit, p.value)
                  }]"
                  @click="handlePrecisionChange(event.id, p.value)"
                  :disabled="isDecimalDisabled(event.unit, p.value)"
                >
                  {{ p.label }}
                </button>
              </div>

              <!--
                【新增】第三列：操作选项。
              -->
              <div class="dropdown-column">
                <!-- 编辑按钮 -->
                <button 
                  class="menu-option-btn"
                  @click="handleEdit(event)" 
                >
                  编辑
                </button>
                <!-- 复制按钮 -->
                <button 
                  class="menu-option-btn"
                  @click="handleCopy(event)" 
                >
                  复制
                </button>
                <!-- 删除按钮，应用 'delete' 类以显示红色文本 -->
                <button 
                  class="menu-option-btn delete"
                  @click="handleMenuDelete(event.id)" 
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <!--
          【移除】原先位于此处的单位和精度切换按钮行已被新的右上角菜单替代。
        -->
      </div>
      <!--
        当事件列表为空时的提示信息。
        - v-if="events.length === 0": 当 `events` 数组为空时渲染此段落。
      -->
      <p 
        v-if="events.length === 0" 
        class="empty-tip"
      >
        暂无自定义倒计时，请添加
      </p>
    </div>

    <!--
      框选（Marquee Select）的矩形选框。
      - v-if="isMarqueeSelecting": 当 `isMarqueeSelecting` 为真时显示。
      - .marquee-select-box: 应用选框的样式。
      - :style: 动态绑定选框的 left, top, width, height 属性，使其跟随鼠标拖拽。
    -->
    <div
      v-if="isMarqueeSelecting"
      class="marquee-select-box"
      :style="{
        left: marqueeBox.x + 'px',
        top: marqueeBox.y + 'px',
        width: marqueeBox.width + 'px',
        height: marqueeBox.height + 'px'
      }"
    ></div>
  </div>

  <!--
    快捷键操作提示浮层。
    - <Transition>: Vue的内置组件，用于实现元素的进入/离开过渡动画。
    - name="hint-fade": 指定使用的过渡动画类名（如 .hint-fade-enter-active）。
  -->
  <Transition
    name="hint-fade"
  >
    <!--
      提示浮层容器。
      - v-if: 当 `showOperationHint` 和 `hoveredEventId` 都为真，且没有待确认操作时显示。
      - .operation-hint: 提示浮层的特定样式。
      - :style: 动态设置浮层的位置，使其跟随鼠标。
    -->
    <div
      v-if="showOperationHint && hoveredEventId && !pendingDeleteId && !pendingCopyId"
      class="operation-hint"
      :style="{ 
        left: mousePosition.x + 'px', 
        top: mousePosition.y + 'px' 
      }"
    >
      <!-- 提示内容 -->
      <div
        class="hint-content"
      >
        <!-- 编辑提示 -->
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Space  或 / 键
          </span>
          <span
            class="hint-action"
          >
            编辑
          </span>
        </div>
        <!-- 复制提示 -->
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Insert 或 + 键
          </span>
          <span
            class="hint-action"
          >
            复制
          </span>
        </div>
        <!-- 删除提示 -->
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Delete 或 - 键
          </span>
          <span
            class="hint-action"
          >
            删除
          </span>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 确认复制操作的提示浮层，逻辑同上 -->
  <Transition
    name="hint-fade"
  >
    <div
      v-if="pendingCopyId && pendingCopyId === hoveredEventId"
      class="copy-confirm-hint"
      :style="{ 
        left: mousePosition.x + 'px', 
        top: mousePosition.y + 'px' 
      }"
    >
      再按一次 Insert 或 + 确认复制
    </div>
  </Transition>
  
  <!-- 确认删除操作的提示浮层，逻辑同上 -->
  <Transition
    name="hint-fade"
  >
    <div
      v-if="pendingDeleteId && pendingDeleteId === hoveredEventId"
      class="delete-confirm-hint"
      :style="{ 
        left: mousePosition.x + 'px', 
        top: mousePosition.y + 'px' 
      }"
    >
      再按一次 Delete 或 - 确认删除
    </div>
  </Transition>

</template>

<script setup>
// ========== 依赖导入 ==========

// 导入Vue组合式API的核心函数
import { 
  ref,
  computed,
  onMounted,
  nextTick,
  onUnmounted,
  watch 
} from 'vue'; 

// 导入Sortable.js库用于实现拖拽排序
import Sortable from 'sortablejs'; 

// 导入从localStorage存取数据的工具函数
import { 
  getCustomEvents,
  saveCustomEvents
} from '../utils/storage'; 

// ========== 状态管理（State Management） ==========

// 控制添加/编辑弹窗是否打开的状态
const isModalOpen = ref(false); 
// 弹窗的标题，根据是添加还是编辑动态变化
const modalTitle = ref('添加自定义倒计时'); 
// 当前正在操作（添加或编辑）的事件数据
const activeEventData = ref(null); 
// 与弹窗内输入框双向绑定的表单数据对象
const eventForm = ref({ year: '', month: '', day: '', hour: '', minute: '', second: '', name: '' }); 
// 存储输入框在获得焦点前的值，用于实现ESC键取消输入
const valueBeforeFocus = ref(''); 
// 存储所有自定义倒计时事件的数组
const events = ref([]); 
// 用于生成默认事件名称的计数器，如 "自定义1", "自定义2"
const customCounter = ref(1); 
// 存储当前打开的菜单对应的事件ID，null表示没有菜单打开
const activeMenu = ref(null); 
// 对事件列表DOM元素的引用，用于Sortable.js
const eventsListRef = ref(null); 
// Sortable.js的实例
let sortableInstance = null; 
// 存储每个事件的动态字体样式
const fontStyles = ref({});
// 存储需要动态计算宽度的DOM元素的引用
const elementRefs = ref({});
// ResizeObserver实例，用于监听元素尺寸变化以自适应字体
let resizeObserver = null; 
// 字号自适应的最大和最小字体大小
const MAX_FONT_SIZE = 16; 
const MIN_FONT_SIZE = 9;  

// 当前的排序模式 ('manual', 'asc', 'desc')
const sortOrder = ref('manual'); 
// 是否处于多选模式
const isMultiSelectMode = ref(false);
// 存储在多选模式下被选中的事件ID的集合
const selectedEventIds = ref(new Set());
// 是否正在进行框选操作
const isMarqueeSelecting = ref(false); 
// 框选开始时的鼠标位置
const marqueeStartPos = ref({ x: 0, y: 0 }); 
// 框选矩形的位置和尺寸
const marqueeBox = ref({ x: 0, y: 0, width: 0, height: 0 }); 
// 存储每个事件条目DOM元素的引用，用于框选计算位置
const eventItemRefs = ref({});

// 当前鼠标悬停的事件ID
const hoveredEventId = ref(null);
// 当前鼠标在页面上的位置，用于定位提示浮层
const mousePosition = ref({ x: 0, y: 0 });
// 是否显示操作快捷键提示浮层
const showOperationHint = ref(false);
// 控制提示浮层显示的定时器
let operationHintTimer = null;
// 控制提示浮层隐藏的定时器
let operationHintHideTimer = null;
// 等待二次确认复制的事件ID
const pendingCopyId = ref(null);
// 等待二次确认删除的事件ID
const pendingDeleteId = ref(null);

// ========== DOM 引用 ==========

// 弹窗内各个输入框的DOM引用
const formYearRef = ref(null);
const formMonthRef = ref(null);
const formDayRef = ref(null);
const formHourRef = ref(null);
const formMinuteRef = ref(null);
const formSecondRef = ref(null);
const formNameRef = ref(null);
// 将DOM引用聚合到一个对象中，方便通过字段名访问
const formRefs = { year: formYearRef, month: formMonthRef, day: formDayRef, hour: formHourRef, minute: formMinuteRef, second: formSecondRef, name: formNameRef };

// ========== 配置与常量 ==========

// 定义弹窗内输入框的Tab/导航顺序
const fieldOrder = [ 'year', 'month', 'day', 'hour', 'minute', 'second', 'name' ];
// 各个输入字段的配置，包括最大长度和数值范围
const fieldConfig = {
  year: { maxLength: 6, min: -99999, max: 99999 },
  month: { maxLength: 2, min: 1, max: 12 },
  day: { maxLength: 2, min: 1, get max() { return getDaysInMonth(eventForm.value.year, eventForm.value.month); } },
  hour: { maxLength: 2, min: 0, max: 23 },
  minute: { maxLength: 2, min: 0, max: 59 },
  second: { maxLength: 2, min: 0, max: 59 },
  name: {}
};
// 【修改】单位选项现在用于新的菜单
const unitOptions = [ { value: 'year', label: '年' }, { value: 'month', label: '月' }, { value: 'week', label: '周' }, { value: 'day', label: '天' }, { value: 'hour', label: '时' }, { value: 'minute', label: '分' }, { value: 'second', label: '秒' } ];
// 【修改】精度选项现在也用于新的菜单
const precisionOptions = [ { value: 'combo', label: '0:0' }, { value: 0, label: '0' }, { value: 1, label: '0.0' }, { value: 2, label: '0.00' } ];
// 单位值到显示标签的映射
const unitLabels = { day: '天', hour: '小时', minute: '分钟', second: '秒', week: '周', month: '个月', year: '年' };

// ========== 核心逻辑：工具函数 ==========

// 获取指定年月的天数
function getDaysInMonth(year, month) { const y = Number(year) || new Date().getFullYear(); const m = Number(month) || 1; return new Date(y, m, 0).getDate(); }
// 获取当前的日期和时间各部分
function getCurrentDateTime() { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() }; }
// 格式化日期时间用于显示，支持公元前年份
function formatDateTimeDesc(year, month, day, hour, minute, second) { const yearNum = parseInt(year); const yearDisplay = yearNum < 0 ? `公元前${Math.abs(yearNum)}年` : `${yearNum}年`; return `${yearDisplay}${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日 ${String(hour || 0).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}:${String(second || 0).padStart(2, '0')}`; }
// 从事件对象中解析并创建一个Date对象，用于排序和比较
const getEventDateObject = (event) => { const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/); if (!match) return new Date(0); const [, year, month, day] = match.map(Number); const timeStr = `${event.hour || 0}:${event.minute || 0}:${event.second || 0}`; const [hour = 0, minute = 0, second = 0] = timeStr.split(':').map(Number); const d = new Date(0); d.setUTCFullYear(year, month - 1, day); d.setUTCHours(hour, minute, second, 0); return d; }

// ========== 核心逻辑：输入处理与交互 ==========

// 统一处理弹窗表单交互的对象
const formInteractionHandler = {
  // 处理输入事件，进行格式化和长度限制
  onInput(event, field) { let value = event.target.value; const config = fieldConfig[field]; if (field === 'year') { value = value.replace(/[^0-9-]/g, ''); if (value.lastIndexOf('-') > 0) { value = value.replace(/-/g, (match, offset) => offset === 0 ? match : ''); } } else if (field !== 'name') { value = value.replace(/\D/g, ''); } if (config.maxLength && value.length > config.maxLength) { value = value.slice(0, config.maxLength); } eventForm.value[field] = value; if (field !== 'name' && value.length >= config.maxLength) { const currentIndex = fieldOrder.indexOf(field); const nextField = fieldOrder[currentIndex + 1]; if (nextField) { formRefs[nextField].value?.focus(); } } },
  // 处理按键事件，实现导航、数值调整、保存和取消等快捷操作
  onKeydown(event, field) { const { key, ctrlKey, metaKey, shiftKey, target } = event; const config = fieldConfig[field]; const navigate = (direction) => { event.preventDefault(); const currentIndex = fieldOrder.indexOf(field); const nextIndex = (currentIndex + direction + fieldOrder.length) % fieldOrder.length; const nextFieldKey = fieldOrder[nextIndex]; formRefs[nextFieldKey].value?.focus(); }; const adjustValue = (delta) => { if (field === 'name') return; event.preventDefault(); let numValue = Number(eventForm.value[field]) || 0; numValue += delta; const { min, max } = config; const maxValue = typeof max === 'function' ? max() : max; if (numValue > maxValue) numValue = min; if (numValue < min) numValue = maxValue; eventForm.value[field] = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); }; switch (key) { case 'Enter': if (ctrlKey || metaKey) { event.preventDefault(); saveEvent(); } else if (field === 'name') { event.preventDefault(); saveEvent(); } else { navigate(1); } break; case 'Tab': navigate(shiftKey ? -1 : 1); break; case 'ArrowLeft': if (ctrlKey || (target.selectionStart === 0 && target.selectionEnd === 0)) { navigate(-1); } break; case 'ArrowRight': if (ctrlKey || (target.selectionStart === target.value.length)) { navigate(1); } break; case 'ArrowUp': adjustValue(1); break; case 'ArrowDown': adjustValue(-1); break; case 'Escape': case 'Esc': event.preventDefault(); event.stopPropagation(); eventForm.value[field] = valueBeforeFocus.value; target.blur(); break; default: if (field !== 'name' && !/^[0-9]$/.test(key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key) && !ctrlKey && !metaKey) { if (!(field === 'year' && key === '-' && target.selectionStart === 0 && !eventForm.value.year.includes('-'))) { event.preventDefault(); } } break; } },
  // 处理鼠标滚轮事件，调整数值
  onWheel(event, field) { if (field === 'name') return; const delta = event.deltaY < 0 ? 1 : -1; let numValue = Number(eventForm.value[field]) || 0; numValue += delta; const { min, max } = fieldConfig[field]; const maxValue = typeof max === 'function' ? max() : max; if (numValue > maxValue) numValue = min; if (numValue < min) numValue = maxValue; eventForm.value[field] = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); },
  // 处理获得焦点事件，预填当前时间并全选内容
  onFocus(event, field) { valueBeforeFocus.value = eventForm.value[field]; if (!eventForm.value[field] && field !== 'name') { const current = getCurrentDateTime(); eventForm.value[field] = field === 'year' ? String(current[field]) : String(current[field]).padStart(2, '0'); } nextTick(() => event.target.select()); },
  // 处理失去焦点事件，进行最终的数值校验和格式化
  onBlur(field) { if (field === 'name' || !eventForm.value[field]) return; let value = eventForm.value[field]; if (field === 'year' && (value === '-' || value === '-0')) { eventForm.value[field] = ''; return; } if (field !== 'year' && value.length === 1) { value = '0' + value; } let numValue = Number(value); const { min, max } = fieldConfig[field]; const maxValue = typeof max === 'function' ? max() : max; if (numValue < min) numValue = min; if (numValue > maxValue) numValue = maxValue; const finalValue = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); if (finalValue !== eventForm.value[field]) { eventForm.value[field] = finalValue; } }
};
// 计算属性：判断当前表单输入是否合法，用于启用/禁用保存按钮
const isFormValid = computed(() => { const form = eventForm.value; if (!form.year || form.year === '-' || form.year === '-0' || isNaN(+form.year) || +form.year < -99999 || +form.year > 99999) { return false; } if (!form.month || +form.month < 1 || +form.month > 12) { return false; } if (!form.day || +form.day < 1 || +form.day > getDaysInMonth(form.year, form.month)) { return false; } if (form.hour === '' || +form.hour < 0 || +form.hour > 23) { return false; } if (form.minute === '' || +form.minute < 0 || +form.minute > 59) { return false; } if (form.second === '' || +form.second < 0 || +form.second > 59) { return false; } return true; });

// ========== 核心逻辑：弹窗控制 ==========

// 打开用于“添加”的弹窗
function openAddModal() { modalTitle.value = '添加自定义倒计时'; activeEventData.value = { id: `new_${Date.now()}`, unit: 'day', decimalPrecision: 0 }; Object.keys(eventForm.value).forEach(k => eventForm.value[k] = ''); isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
// 【修改】处理菜单中的“编辑”操作
function handleEdit(event) { activeMenu.value = null; modalTitle.value = '编辑事件'; activeEventData.value = { ...event }; const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/); if (match) { const [, y, m, d] = match; Object.assign(eventForm.value, { ...event, year: y, month: m, day: d }); } isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
// 【修改】处理菜单中的“复制”操作
function handleCopy(eventToCopy) { activeMenu.value = null; modalTitle.value = '复制并新增事件'; const newEventData = { ...eventToCopy, id: `new_${Date.now()}`, name: `${eventToCopy.name} - 副本` }; activeEventData.value = newEventData; const match = newEventData.date.match(/^(-?\d+)-(\d+)-(\d+)$/); if (match) { const [, y, m, d] = match; Object.assign(eventForm.value, { ...newEventData, year: y, month: m, day: d }); } isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
// 关闭弹窗
function closeModal() { isModalOpen.value = false; activeEventData.value = null; }

// ========== 核心逻辑：数据持久化 ==========

// 保存事件（添加或编辑后）
function saveEvent() { if (!isFormValid.value) { alert('请填写完整且合法的时间'); return; } const f = eventForm.value; const newEvent = { ...activeEventData.value, name: f.name || `自定义${customCounter.value}`, date: `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`, hour: String(f.hour), minute: String(f.minute), second: String(f.second) }; const existingIndex = events.value.findIndex(e => e.id === newEvent.id); if (existingIndex !== -1) { events.value[existingIndex] = newEvent; } else { newEvent.id = Date.now(); events.value.unshift(newEvent); if (!f.name) customCounter.value++; } saveCustomEvents(events.value); updateAllEventsDisplay(); closeModal(); }
// 处理通用删除逻辑
function handleDelete(id) { events.value = events.value.filter(e => e.id !== id); saveCustomEvents(events.value); updateAllEventsDisplay(); if (pendingDeleteId.value === id) { pendingDeleteId.value = null; } }
// 【修改】处理菜单中的“删除”操作
function handleMenuDelete(id) { activeMenu.value = null; if (confirm('确定要删除这个事件吗？')) { handleDelete(id); } }

// ========== 新增与修改：排序、多选和框选逻辑 ==========

// 循环切换排序模式
function cycleSortOrder() { const orderCycle = { manual: 'asc', asc: 'desc', desc: 'manual' }; sortOrder.value = orderCycle[sortOrder.value]; if (sortOrder.value === 'manual') { const savedEvents = getCustomEvents(); events.value = savedEvents.map(event => { const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/); return { ...event, finalDisplay: '', dateTimeDesc: match ? formatDateTimeDesc(match[1], match[2], match[3], event.hour, event.minute, event.second) : '' }; }); if (sortableInstance) { sortableInstance.option('disabled', false); } } else { events.value.sort((a, b) => { const dateA = getEventDateObject(a); const dateB = getEventDateObject(b); return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA; }); if (sortableInstance) { sortableInstance.option('disabled', true); } } nextTick(updateAllEventsDisplay); }
// 切换多选模式
function toggleMultiSelectMode() { isMultiSelectMode.value = !isMultiSelectMode.value; if (!isMultiSelectMode.value) { selectedEventIds.value.clear(); } updateAllEventsDisplay(); }
// 处理在多选模式下点击条目的逻辑
function handleItemClick(event) { if (!isMultiSelectMode.value) return; if (selectedEventIds.value.has(event.id)) { selectedEventIds.value.delete(event.id); } else { selectedEventIds.value.add(event.id); } updateAllEventsDisplay(); }
// 批量删除选中的条目
function bulkDelete() { if (selectedEventIds.value.size === 0) return; if (confirm(`您确定要删除选中的 ${selectedEventIds.value.size} 个倒计时吗？此操作不可撤销。`)) { events.value = events.value.filter(event => !selectedEventIds.value.has(event.id)); saveCustomEvents(events.value); selectedEventIds.value.clear(); isMultiSelectMode.value = false; updateAllEventsDisplay(); } }

// ========== 核心逻辑：倒计时显示与更新 ==========

// 主时钟循环的ID
let animationFrameId = null;

// 计算单个事件的有效刷新间隔（毫秒）
function getEffectiveInterval(event) { if (event.decimalPrecision === 'combo' || event.unit === 'second') { return 1000; } const precision = event.decimalPrecision || 0; if (precision === 0) { switch(event.unit) { case 'minute': return 60 * 1000; case 'hour': return 60 * 60 * 1000; default: return 1000; } } const factor = Math.pow(10, -precision); let unitMillis; switch(event.unit) { case 'minute': unitMillis = 60 * 1000; break; case 'hour': unitMillis = 60 * 60 * 1000; break; case 'day': unitMillis = 24 * 60 * 60 * 1000; break; case 'week': unitMillis = 7 * 24 * 60 * 60 * 1000; break; case 'month': unitMillis = 30.44 * 24 * 60 * 60 * 1000; break; case 'year': unitMillis = 365.24 * 24 * 60 * 60 * 1000; break; default: unitMillis = 1000; } return Math.max(50, factor * unitMillis); }
// 计算常规倒计时的值
function calculateCustomCountdown(targetDateStr, targetTime, now, unit, decimalPrecision) { try { const match = targetDateStr.match(/^(-?\d+)-(\d+)-(\d+)$/); if (!match) return { value: 0, isPast: false }; const [, year, month, day] = match.map(Number); const [hour = 0, minute = 0, second = 0] = targetTime.split(':').map(Number); const target = new Date(); target.setFullYear(year, month - 1, day); target.setHours(hour, minute, second, 0); const current = new Date(now); const isPast = target < current; const [start, end] = isPast ? [target, current] : [current, target]; let value; switch (unit) { case 'year': { let fullYears = end.getFullYear() - start.getFullYear(); const anniversary = new Date(start); anniversary.setFullYear(end.getFullYear()); if (end < anniversary) fullYears--; const lastAnniversary = new Date(start); lastAnniversary.setFullYear(start.getFullYear() + fullYears); const nextAnniversary = new Date(lastAnniversary); nextAnniversary.setFullYear(lastAnniversary.getFullYear() + 1); const durationOfLastYear = nextAnniversary.getTime() - lastAnniversary.getTime(); const timeIntoLastYear = end.getTime() - lastAnniversary.getTime(); value = fullYears + (timeIntoLastYear / durationOfLastYear); break; } case 'month': { let fullMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()); const anniversary = new Date(start); anniversary.setMonth(anniversary.getMonth() + fullMonths); if (end < anniversary) fullMonths--; const lastAnniversary = new Date(start); lastAnniversary.setMonth(start.getMonth() + fullMonths); const nextAnniversary = new Date(lastAnniversary); nextAnniversary.setMonth(lastAnniversary.getMonth() + 1); const durationOfLastMonth = nextAnniversary.getTime() - lastAnniversary.getTime(); const timeIntoLastMonth = end.getTime() - lastAnniversary.getTime(); value = fullMonths + (timeIntoLastMonth / durationOfLastMonth); break; } case 'week': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24 * 7); break; case 'day': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24); break; case 'hour': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60); break; case 'minute': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60); break; case 'second': value = Math.abs(target.getTime() - current.getTime()) / 1000; break; default: value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24); } return { value: decimalPrecision == null ? value : parseFloat(value.toFixed(decimalPrecision)), isPast }; } catch (error) { return { value: 0, isPast: false }; } }
// 计算组合模式下的显示文本
function getCustomComboDisplay(targetDateStr, targetTime, now) { try { const match = targetDateStr.match(/^(-?\d+)-(\d+)-(\d+)$/); if (!match) return '解析错误'; const [, year, month, day] = match.map(Number); const [hour = 0, minute = 0, second = 0] = targetTime.split(':').map(Number); const target = new Date(); target.setFullYear(year, month - 1, day); target.setHours(hour, minute, second, 0); const current = new Date(now); let isPast = target < current; let [start, end] = isPast ? [target, current] : [current, target]; let years = end.getFullYear() - start.getFullYear(), months = end.getMonth() - start.getMonth(), days = end.getDate() - start.getDate(), hours = end.getHours() - start.getHours(), minutes = end.getMinutes() - start.getMinutes(), seconds = end.getSeconds() - start.getSeconds(); if (seconds < 0) { seconds += 60; minutes--; } if (minutes < 0) { minutes += 60; hours--; } if (hours < 0) { hours += 24; days--; } if (days < 0) { const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0); days += prevMonth.getDate(); months--; } if (months < 0) { months += 12; years--; } const timeUnits = [ { num: years, unit: '年' }, { num: months, unit: '个月' }, { num: days, unit: '天' }, { num: hours, unit: '小时' }, { num: minutes, unit: '分' }, { num: seconds, unit: '秒' } ]; let firstNonZero = 0; while (firstNonZero < timeUnits.length - 1 && timeUnits[firstNonZero].num === 0) { firstNonZero++; } let trimmed = timeUnits.slice(firstNonZero); let lastNonZero = trimmed.length - 1; while (lastNonZero >= 0 && trimmed[lastNonZero].num === 0) { lastNonZero--; } let core = trimmed.slice(0, lastNonZero + 1); let endZeroCount = trimmed.length - 1 - lastNonZero; let outArr = []; for (let i = 0; i < core.length;) { if (core[i].num > 0) { outArr.push(` <span class="combo-num">${core[i].num}</span> ${core[i].unit}`); i++; } else { let k = i; while (k < core.length && core[k].num === 0) k++; outArr.push(' 零'); i = k; } } if (endZeroCount) outArr.push(' 整'); if (outArr.length === 0) outArr.push(' <span class="combo-num">0</span> 秒'); return (isPast ? '已过' : '还有') + outArr.join(''); } catch (error) { return '计算错误'; } }
// 更新单个事件的显示内容
function updateSingleEventDisplay(event, now = new Date()) { const targetTime = `${(event.hour || '0').padStart(2, '0')}:${(event.minute || '0').padStart(2, '0')}:${(event.second || '0').padStart(2, '0')}`; if (event.decimalPrecision === 'combo') { event.finalDisplay = getCustomComboDisplay(event.date, targetTime, now); } else { const result = calculateCustomCountdown(event.date, targetTime, now, event.unit, event.decimalPrecision); const prefix = result.isPast ? '已过 ' : '还有 '; event.finalDisplay = `${prefix}<strong class="combo-num">${result.value.toFixed(event.decimalPrecision)}</strong> ${unitLabels[event.unit]}`; } if (event.date) { const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/); if (match) { event.dateTimeDesc = formatDateTimeDesc(match[1], match[2], match[3], event.hour, event.minute, event.second); } } nextTick(updateAllFontSizes); }
// 更新所有事件的显示内容
function updateAllEventsDisplay() { const now = new Date(); events.value.forEach(event => updateSingleEventDisplay(event, now)); }
// 主时钟循环，按需更新每个事件
function mainLoop() { const now = Date.now(); events.value.forEach(event => { if (!event.nextUpdateTime || now >= event.nextUpdateTime) { updateSingleEventDisplay(event, new Date(now)); const interval = getEffectiveInterval(event); event.nextUpdateTime = now + interval; } }); animationFrameId = requestAnimationFrame(mainLoop); }

// ========== 字号自适应逻辑 ==========

// 设置DOM元素的引用，用于后续的尺寸计算
const setElementRef = (el, eventId, type) => { if (el) { if (!elementRefs.value[eventId]) { elementRefs.value[eventId] = {}; } elementRefs.value[eventId][type] = el; } };
// 调整单个元素的字体大小以适应其容器宽度
const adjustFontSize = (element) => { if (!element) { return {}; } let currentFontSize = MAX_FONT_SIZE; element.style.fontSize = `${currentFontSize}px`; while (element.scrollWidth > element.clientWidth && currentFontSize > MIN_FONT_SIZE) { currentFontSize -= 0.5; element.style.fontSize = `${currentFontSize}px`; } return { fontSize: `${currentFontSize}px` }; };
// 更新所有已引用元素的字体大小
const updateAllFontSizes = () => { for (const eventId in elementRefs.value) { const refs = elementRefs.value[eventId]; if (refs) { if (!fontStyles.value[eventId]) { fontStyles.value[eventId] = {}; } if (refs.date) { fontStyles.value[eventId].date = adjustFontSize(refs.date); } if (refs.countdown) { fontStyles.value[eventId].countdown = adjustFontSize(refs.countdown); } } } };

// ========== 【修改】交互处理（菜单控制、单位/精度切换等） ==========

// 切换指定ID事件的菜单显示状态
function toggleMenu(id) { activeMenu.value = activeMenu.value === id ? null : id; }// 处理单位更改
function handleUnitChange(id, unit) {
  const event = events.value.find(e => e.id === id);
  if (event) {
    event.unit = unit;

    // [新增] 如果之前的精度是'combo'，则在新单位下自动切换为'0'
    if (event.decimalPrecision === 'combo') {
      event.decimalPrecision = 0;
    }

    // 保持原有的非法精度组合修正逻辑
    if (unit === 'second' && event.decimalPrecision !== 'combo' && event.decimalPrecision > 0) {
      event.decimalPrecision = 0;
    }
    if (unit === 'minute' && event.decimalPrecision === 2) {
      event.decimalPrecision = 1;
    }

    saveCustomEvents(events.value);
    event.nextUpdateTime = 0; // 立即刷新
    updateSingleEventDisplay(event);
  }
  activeMenu.value = null; /* 关闭菜单 */
}

// 处理精度更改
function handlePrecisionChange(id, precision) { const event = events.value.find(e => e.id === id); if (event) { event.decimalPrecision = precision; saveCustomEvents(events.value); event.nextUpdateTime = 0; updateSingleEventDisplay(event); } activeMenu.value = null; /* 关闭菜单 */ }
// 判断某个精度选项对于当前单位是否禁用
const isDecimalDisabled = (unit, decimalValue) => (unit === 'second' && decimalValue !== 'combo' && decimalValue > 0) || (unit === 'minute' && decimalValue === 2);
// 处理鼠标进入事件条目区域
function handleEventMouseEnter(eventId) { if (window.innerWidth <= 800) return; if (pendingCopyId.value && pendingCopyId.value !== eventId) { pendingCopyId.value = null; } if (pendingDeleteId.value && pendingDeleteId.value !== eventId) { pendingDeleteId.value = null; } hoveredEventId.value = eventId; if (operationHintTimer) clearTimeout(operationHintTimer); if (operationHintHideTimer) clearTimeout(operationHintHideTimer); operationHintTimer = setTimeout(() => { showOperationHint.value = true; operationHintHideTimer = setTimeout(() => { showOperationHint.value = false; }, 3000); }, 500); }
// 处理鼠标离开事件条目区域
function handleEventMouseLeave() { if (window.innerWidth <= 800) return; hoveredEventId.value = null; showOperationHint.value = false; if (operationHintTimer) clearTimeout(operationHintTimer); if (operationHintHideTimer) clearTimeout(operationHintHideTimer); pendingCopyId.value = null; pendingDeleteId.value = null; }
// 处理鼠标在事件条目上移动
function handleEventMouseMove(e) { if (window.innerWidth <= 800) return; mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 }; }

// ========== 框选功能相关函数 ==========

// 检查两个矩形是否相交
function checkIntersection(rect1, rect2) { return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom); }
// 开始框选
function startMarquee(clientX, clientY, e) { if (!isMultiSelectMode.value) return; const ignoredSelectors = [ '.event-container', '.custom-countdown-header', 'button', 'a', 'input', 'select', 'textarea', '.modal-overlay' ]; if (ignoredSelectors.some(selector => e.target.closest(selector))) { return; } e.preventDefault(); e.stopPropagation(); isMarqueeSelecting.value = true; marqueeStartPos.value = { x: clientX, y: clientY }; }
// 移动框选矩形并更新选中项
function moveMarquee(clientX, clientY, e) { if (!isMarqueeSelecting.value) return; e.preventDefault(); e.stopPropagation(); const start = marqueeStartPos.value; const end = { x: clientX, y: clientY }; marqueeBox.value = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y) }; const marqueeRect = { left: marqueeBox.value.x, top: marqueeBox.value.y, right: marqueeBox.value.x + marqueeBox.value.width, bottom: marqueeBox.value.y + marqueeBox.value.height }; for (const id in eventItemRefs.value) { const itemEl = eventItemRefs.value[id]; if (itemEl) { const itemRect = itemEl.getBoundingClientRect(); if (checkIntersection(marqueeRect, itemRect)) { selectedEventIds.value.add(Number(id)); } } } updateAllEventsDisplay(); }
// 结束框选
function endMarquee() { if (!isMarqueeSelecting.value) return; isMarqueeSelecting.value = false; updateAllEventsDisplay(); }
// 鼠标按下事件处理器
const handleMouseDown = (e) => { if (e.button === 0) startMarquee(e.clientX, e.clientY, e); };
// 鼠标移动事件处理器
const handleMouseMove = (e) => moveMarquee(e.clientX, e.clientY, e);
// 鼠标抬起事件处理器
const handleMouseUp = () => endMarquee();
// 触摸开始事件处理器
const handleTouchStart = (e) => { if (e.touches.length === 1) startMarquee(e.touches[0].clientX, e.touches[0].clientY, e); };
// 触摸移动事件处理器
const handleTouchMove = (e) => { if (e.touches.length === 1) moveMarquee(e.touches[0].clientX, e.touches[0].clientY, e); };
// 触摸结束事件处理器
const handleTouchEnd = () => endMarquee();

// ========== 快捷键处理 ==========

// 处理编辑快捷键
const handleEditShortcut = (event) => handleEdit(event);
// 处理复制快捷键（带二次确认）
const handleCopyShortcut = (event) => { if (pendingCopyId.value === event.id) { handleCopy(event); pendingCopyId.value = null; } else { pendingCopyId.value = event.id; pendingDeleteId.value = null; setTimeout(() => { if (pendingCopyId.value === event.id) pendingCopyId.value = null; }, 3000); } };
// 处理删除快捷键（带二次确认）
const handleDeleteShortcut = (event) => { if (pendingDeleteId.value === event.id) { handleDelete(event.id); pendingDeleteId.value = null; } else { pendingDeleteId.value = event.id; pendingCopyId.value = null; setTimeout(() => { if (pendingDeleteId.value === event.id) pendingDeleteId.value = null; }, 3000); } };
// 快捷键到操作函数的映射
const keyActionMap = { ' ': handleEditShortcut, '/': handleEditShortcut, 'Insert': handleCopyShortcut, '+': handleCopyShortcut, 'Delete': handleDeleteShortcut, '-': handleDeleteShortcut };
// 全局键盘事件处理器
function handleGlobalKeydown(e) { if (isModalOpen.value && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (isFormValid.value) saveEvent(); return; } if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); if (activeMenu.value) { activeMenu.value = null; return; } if (pendingCopyId.value || pendingDeleteId.value) { pendingCopyId.value = null; pendingDeleteId.value = null; return; } const activeEl = document.activeElement; const isInModal = activeEl && activeEl.closest('.modal-content'); if (isModalOpen.value && !isInModal) { closeModal(); return; } if (isMultiSelectMode.value) { toggleMultiSelectMode(); return; } return; } const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'); if (isInputFocused || !hoveredEventId.value) return; const event = events.value.find(e => e.id === hoveredEventId.value); if (!event) return; const action = keyActionMap[e.key]; if (action) { e.preventDefault(); showOperationHint.value = false; action(event); } }
// 全局点击或触摸事件处理器，用于关闭菜单
function handleGlobalClickOrTouch(e) { if (!e.target.closest('.settings-menu-container')) { activeMenu.value = null; } }

// ========== 生命周期钩子 ==========

// 组件挂载时执行
onMounted(() => {
  // 从localStorage加载已保存的事件
  const savedEvents = getCustomEvents();
  // 初始化事件数组
  events.value = savedEvents.map(event => ({
    ...event,
    finalDisplay: '',
    dateTimeDesc: '',
    nextUpdateTime: 0 // 初始化下次更新时间
  }));
  
  // 初始化默认事件名称的计数器
  customCounter.value = Math.max(0, ...savedEvents.map(e => parseInt(e.name.match(/^自定义(\d+)$/)?.[1] || 0))) + 1;
  
  // 首次渲染所有事件
  updateAllEventsDisplay();
  
  // 启动主时钟循环
  mainLoop();

  // 初始化ResizeObserver用于字体自适应
  if (eventsListRef.value) { resizeObserver = new ResizeObserver(() => { updateAllFontSizes(); }); resizeObserver.observe(eventsListRef.value); }
  // 注册全局事件监听器
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('click', handleGlobalClickOrTouch, true);
  document.addEventListener('touchstart', handleGlobalClickOrTouch, true);
  // 在下一帧初始化Sortable.js
  nextTick(() => {
    if (eventsListRef.value) {
      const sortableOptions = { animation: 220, handle: '.drag-handle, .drag-blank-area', ghostClass: 'drag-ghost', chosenClass: 'drag-chosen', dragClass: 'drag-dragging', onEnd: (evt) => { sortOrder.value = 'manual'; if (sortableInstance) { sortableInstance.option('disabled', false); } if (evt.oldIndex != null && evt.newIndex != null && evt.oldIndex !== evt.newIndex) { const moved = events.value.splice(evt.oldIndex, 1)[0]; events.value.splice(evt.newIndex, 0, moved); saveCustomEvents(events.value); } } };
      if (window.innerWidth <= 800) { sortableOptions.delay = 300; sortableOptions.delayOnTouchOnly = true; }
      sortableInstance = Sortable.create(eventsListRef.value, sortableOptions);
    }
  });

  // 监听多选模式的变化，动态添加或移除框选的事件监听器
  watch(isMultiSelectMode, (isMulti) => {
    if (isMulti) {
      window.addEventListener('mousedown', handleMouseDown, true);
      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('mouseup', handleMouseUp, true);
      window.addEventListener('touchstart', handleTouchStart, true);
      window.addEventListener('touchmove', handleTouchMove, true);
      window.addEventListener('touchend', handleTouchEnd, true);
    } else {
      window.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
      window.removeEventListener('touchmove', handleTouchMove, true);
      window.removeEventListener('touchend', handleTouchEnd, true);
      isMarqueeSelecting.value = false;
    }
  }, { immediate: false });
});

// 组件卸载时执行
onUnmounted(() => {
  // 停止主时钟循环
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // 移除所有全局事件监听器
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('click', handleGlobalClickOrTouch, true);
  document.removeEventListener('touchstart', handleGlobalClickOrTouch, true);
  
  window.removeEventListener('mousedown', handleMouseDown, true);
  window.removeEventListener('mousemove', handleMouseMove, true);
  window.removeEventListener('mouseup', handleMouseUp, true);
  window.removeEventListener('touchstart', handleTouchStart, true);
  window.removeEventListener('touchmove', handleTouchMove, true);
  window.removeEventListener('touchend', handleTouchEnd, true);

  // 销毁Sortable.js实例
  if (sortableInstance) sortableInstance.destroy();
  // 清除所有可能存在的定时器
  if (operationHintTimer) clearTimeout(operationHintTimer);
  if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
  // 断开ResizeObserver的连接
  if (resizeObserver) { resizeObserver.disconnect(); }
});
</script>

<style scoped>
/* ========== 组件容器与标题 ========== */

/* 自定义倒计时组件的根容器样式 */
.custom-countdown {
  margin-bottom: 8px; /* 与下方元素的间距 */
}

/* 头部三栏网格布局 */
.custom-countdown-header.three-column-header {
  display: grid; /* 使用网格布局 */
  grid-template-columns: auto 1fr 1fr; /* 定义三列：左右两列自适应，中间列内容宽度 */
  align-items: center; /* 垂直居中对齐 */
  gap: 20px; /* 列间距 */
  margin-bottom: 20px; /* 与事件列表的间距 */
}

/* 响应式：屏幕宽度小于800px时，头部变为单列布局 */
@media (max-width: 800px) {
  .custom-countdown-header {
    grid-template-columns: 1fr; /* 变为一列 */
    gap: 15px; /* 行间距 */
  }
}

/* 头部左侧区域，内容靠左 */
.header-zone-left {
  justify-self: start;
}

/* 头部中间区域，内容居中 */
.header-zone-center {
  justify-self: center;
}

/* 头部右侧区域，内容靠右 */
.header-zone-right {
  justify-self: end;
}

/* 模块标题样式 */
.title {
  font-size: 18px; /* 字体大小 */
  color: var(--text-secondary); /* 颜色 */
  font-weight: 400; /* 字重 */
  margin: 0; /* 无外边距 */
}

/* 响应式：小屏幕下标题也居中 */
@media (max-width: 800px) {
  .title {
    justify-self: center;
  }
}

/* 头部右侧操作按钮容器 */
.header-actions {
  display: flex; /* Flex布局 */
  justify-content: flex-end; /* 内容靠右 */
  align-items: center; /* 垂直居中 */
  gap: 10px; /* 按钮间距 */
}

/* 响应式：小屏幕下操作按钮居中并可换行 */
@media (max-width: 800px) {
  .header-actions {
    justify-content: center; /* 居中 */
    flex-wrap: wrap; /* 允许换行 */
  }
}

/* ========== 按钮通用与特定样式 ========== */

/* 头部功能按钮的基础样式 */
.action-btn {
  width: 40px;
  height: 36px; /* 高度 */
  padding: 0 12px; /* 水平内边距 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  gap: 6px; /* 图标与文字间距 */
  font-size: 14px; /* 字体大小 */
  background-color: var(--bg-secondary); /* 背景色 */
  color: var(--text-secondary); /* 文字颜色 */
  border: 0px solid var(--border-color); /* 边框 */
  border-radius: 6px; /* 圆角 */
}

/* 连体按钮组中的按钮无圆角 */
.joined-btn.action-btn {
  border-radius: 0;
}

/* 连体按钮内的SVG图标垂直对齐 */
.action-btn.joined-btn svg {
  vertical-align: middle;
}

/* 按钮悬停效果 */
.action-btn:hover {
  background-color: var(--bg-quaternary); /* 改变背景色 */
  color: var(--text-primary); /* 改变文字颜色 */
}

/* 按钮激活状态（如排序模式、多选模式开启时） */
.action-btn.active {
  background-color: var(--green-primary); /* 主题绿色背景 */
  color: var(--bg-primary); /* 深色文字 */
  border-color: var(--green-primary); /* 边框颜色 */
}

/* 批量删除按钮的特定样式 */
.bulk-delete-btn {
  background-color: #5f2120; /* 深红色背景 */
  color: #ffcdd2; /* 浅红色文字 */
  border: 1px solid #a13531; /* 红色边框 */
  height: 36px; /* 高度 */
  padding: 0 12px; /* 内边距 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  gap: 6px; /* 间距 */
  font-size: 14px; /* 字号 */
  font-weight: 500; /* 字重 */
  border-radius: 6px; /* 圆角 */
}

/* 批量删除按钮悬停效果 */
.bulk-delete-btn:hover {
  background-color: #d32f2f; /* 亮红色背景 */
  color: white; /* 白色文字 */
  border-color: #d32f2f; /* 亮红色边框 */
}

/* “添加倒计时”按钮的特定样式 */
.add-new-event-btn {
  height: 36px; /* 高度 */
  font-size: 14px; /* 字号 */
}

/* ========== 事件列表及条目 ========== */

/* 事件列表容器 */
.events-list {
  display: flex; /* Flex布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 15px; /* 条目间距 */
}

/* 单个事件条目的容器 */
.event-container {
  background: var(--bg-tertiary); /* 背景色 */
  border-radius: 12px; /* 圆角 */
  padding: 15px; /* 内边距 */
  position: relative; /* 相对定位，用于内部绝对定位元素 */
  overflow: visible; /* 允许菜单弹出外部 */
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s; /* 过渡效果 */
  cursor: default; /* 默认光标 */
}

/* [新增] 当菜单被激活时，提升整个容器的堆叠层级 */
.event-container.menu-is-active {
  z-index: 20;
}

/* 多选模式下被选中的条目样式 */
.event-container.is-selected {
  background: var(--bg-quaternary); /* 更亮的背景 */
  box-shadow: 0 0 0 2px var(--green-primary); /* 绿色外发光 */
  border-color: var(--green-primary); /* 绿色边框 */
}

/* 桌面端悬停效果 */
@media (min-width: 801px) {
  .event-container:not(.is-selected):hover {
    background: var(--bg-quaternary);
  }
  .event-container.is-selected {
    cursor: pointer; /* 多选模式下选中项显示可点击手势 */
  }
}

/* 事件条目内部内容网格布局 */
.event-item {
  position: relative; /* 相对定位 */
  display: grid; /* 网格布局 */
  grid-template-columns: minmax(220px, 1fr) 1fr minmax(320px, 2fr) 40px; /* 四列布局 */
  gap: 20px; /* 列间距 */
  align-items: center; /* 垂直居中 */
}

/* 响应式：小屏幕下事件条目变为垂直Flex布局 */
@media (max-width: 800px) {
  .event-item {
    display: flex !important; /* 强制Flex布局 */
    flex-direction: column !important; /* 垂直排列 */
    align-items: center !important; /* 居中对齐 */
    width: 100%; /* 占满宽度 */
    gap: 8px; /* 间距 */
    text-align: center; /* 文本居中 */
  }
}

/* 三个主要信息列的通用样式 */
.event-date-column,
.event-name-column,
.event-countdown-column {
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  font-size: 16px; /* 字号 */
  color: var(--text-primary); /* 颜色 */
  font-weight: 500; /* 字重 */
  text-align: center; /* 文本居中 */
  transition: color 0.2s; /* 颜色过渡效果 */
  min-height: 24px; /* 最小高度，防止空内容时塌陷 */
}

/* 响应式：小屏幕下信息列占满宽度并居中 */
@media (max-width: 800px) {
  .event-date-column,
  .event-name-column,
  .event-countdown-column {
    width: 100%; /* 占满宽度 */
    text-align: center !important; /* 强制居中 */
    justify-content: center; /* 水平居中 */
  }
}

/* 日期和倒计时列不允许换行 */
.event-date-column,
.event-countdown-column {
  white-space: nowrap;
}

/* 事件名称列允许换行 */
.event-name-column {
  white-space: normal;
  word-break: break-all;
}

/* 倒计时列中高亮的数字部分样式 */
:deep(.event-countdown-column strong),
:deep(.event-countdown-column .combo-num) {
  color: var(--green-primary); /* 主题绿色 */
  font-weight: 600; /* 加粗 */
  margin: 0 4px; /* 水平外边距 */
  font-style: normal; /* 正常字体样式 */
  transition: color 0.2s; /* 颜色过渡 */
}

/* 列表为空时的提示信息 */
.empty-tip {
  text-align: center; /* 居中 */
  color: var(--text-tertiary); /* 灰色文字 */
  font-size: 14px; /* 字号 */
  padding: 20px; /* 内边距 */
}

/* ========== 弹窗样式 ========== */

/* 弹窗遮罩层 */
.modal-overlay {
  position: fixed; /* 固定定位 */
  top: 0; left: 0; right: 0; bottom: 0; /* 铺满全屏 */
  background: rgba(0, 0, 0, 0.7); /* 半透明黑色背景 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  z-index: 2000; /* 置于顶层 */
}

/* 弹窗内容区域 */
.modal-content {
  background: var(--bg-secondary); /* 背景色 */
  border-radius: 12px; /* 圆角 */
  padding: 24px; /* 内边距 */
  min-width: 400px; /* 最小宽度 */
  max-width: 90vw; /* 最大宽度为视口宽度的90% */
}

/* 响应式：小屏幕下弹窗宽度调整 */
@media (max-width: 800px) {
  .modal-content {
    min-width: 90vw;
  }
}

/* 弹窗标题 */
.modal-title {
  font-size: 18px; /* 字号 */
  color: var(--text-primary); /* 颜色 */
  margin-bottom: 20px; /* 与表单的间距 */
  text-align: center; /* 居中 */
}

/* 弹窗表单容器 */
.modal-form {
  display: flex; /* Flex布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 12px; /* 项目间距 */
  align-items: center; /* 水平居中 */
  margin-bottom: 20px; /* 与操作按钮的间距 */
}

/* 表单中的输入框组（如年月日一组） */
.modal-form .input-group {
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  gap: 2px; /* 内部元素间距 */
  justify-content: center; /* 居中 */
  width: 100%; /* 占满宽度 */
  margin-bottom: 7px; /* 组间距 */
}

/* 弹窗操作按钮区域 */
.modal-actions {
  display: flex; /* Flex布局 */
  gap: 10px; /* 按钮间距 */
  justify-content: flex-end; /* 靠右对齐 */
}

/* 次要按钮样式（如取消按钮） */
.button-secondary {
  background: var(--bg-tertiary); /* 背景色 */
  color: var(--text-primary); /* 文字颜色 */
  border: 1px solid var(--border-color); /* 边框 */
}
/* 次要按钮悬停效果 */
.button-secondary:hover {
  background: var(--border-color);
}

/* 通用输入框样式 */
.input {
  height: 40px; /* 高度 */
  min-height: 40px; /* 最小高度 */
  line-height: 40px; /* 行高 */
  width: 96px; /* 宽度 */
  padding: 0 8px; /* 水平内边距 */
  border-radius: 6px; /* 圆角 */
  border: 1px solid var(--border-color); /* 边框 */
  background: var(--bg-tertiary); /* 背景色 */
  color: var(--text-primary); /* 文字颜色 */
  font-size: 14px; /* 字号 */
  text-align: center; /* 文本居中 */
  box-sizing: border-box; /* 盒模型 */
  outline: none; /* 去除焦点轮廓 */
  transition: border-color 0.2s, box-shadow 0.2s; /* 过渡效果 */
}

/* 输入框获得焦点时的样式 */
.input:focus {
  border-color: var(--green-primary); /* 绿色边框 */
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); /* 绿色外发光 */
}

/* 输入框占位符样式 */
.input::placeholder {
  color: var(--text-tertiary); /* 灰色文字 */
  opacity: 0.5; /* 透明度 */
}

/* 日期/时间分隔符样式 */
.date-separator {
  width: 10px; /* 宽度 */
  text-align: center; /* 居中 */
  color: var(--text-secondary); /* 颜色 */
  font-size: 16px; /* 字号 */
  margin: 0 2px; /* 水平外边距 */
}

/* 事件名称输入框特定样式 */
.event-name-input {
  width: 324px; /* 宽度 */
  min-width: 120px; /* 最小宽度 */
  max-width: 100%; /* 最大宽度 */
  margin: 0; /* 无外边距 */
}

/* 响应式：小屏幕下事件名称输入框宽度调整 */
@media (max-width: 800px) {
  .event-name-input {
    min-width: calc(90vw - 80px);
  }
}

/* ========== 【修改】拖拽与菜单 ========== */

/* 仅在桌面端显示的元素 */
.desktop-only { display: none; }
/* 仅在移动端显示的元素 */
.mobile-only { display: block; position: absolute; left: 0; top: 0; bottom: 0; right: 0; z-index: 5; cursor: move; }

/* 响应式：控制桌面/移动端元素的显示切换 */
@media (min-width: 801px) {
  .desktop-only { display: flex !important; }
  .mobile-only { display: none !important; }
}

/* 拖拽手柄样式 */
.drag-handle {
  position: absolute; /* 绝对定位 */
  top: 50%; /* 垂直居中 */
  transform: translateY(-50%); /* 精确垂直居中 */
  width: 20px; /* 宽度 */
  height: 40px; /* 高度 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  cursor: move; /* 移动手势 */
  color: var(--text-tertiary); /* 颜色 */
  opacity: 0; /* 默认透明 */
  transition: opacity 0.2s, color 0.2s, background 0.2s, transform 0.2s; /* 过渡效果 */
  z-index: 10; /* 层级 */
}

/* 响应式：桌面端悬停时显示拖拽手柄 */
@media (min-width: 801px) {
  .event-container:hover .drag-handle {
    opacity: 1;
  }
}

/* 左侧拖拽手柄定位 */
.drag-handle-left { left: -20px; }
/* 右侧拖拽手柄定位 */
.drag-handle-right { right: -20px; }

/* 拖拽手柄悬停效果 */
.drag-handle:hover {
  color: var(--green-primary); /* 绿色图标 */
  background: var(--bg-tertiary); /* 背景色 */
  transform: translateY(-50%) scale(1.1); /* 放大效果 */
}

/* Sortable.js拖拽过程中的样式 */
.drag-chosen,
.drag-dragging {
  box-shadow: 0 8px 40px rgba(52, 206, 99, .22), 0 2px 18px #0004; /* 阴影 */
  transform: scale(1.03); /* 放大 */
  z-index: 100; /* 置于顶层 */
  cursor: move; /* 移动手势 */
}

/* Sortable.js拖拽占位符的样式 */
.drag-ghost {
  opacity: 0.2 !important; /* 半透明 */
  background: var(--bg-tertiary); /* 背景色 */
  box-shadow: none !important; /* 无阴影 */
  transform: scale(1) !important; /* 不放大 */
}

/* 【新增】事件条目内菜单的容器，绝对定位到右上角 */
.settings-menu-container {
  position: absolute; top: -8px; right: -10px; z-index: 10;
}

/* 【新增】菜单触发按钮（三点）样式，与CountdownCard统一 */
.menu-trigger-btn {
  width: 32px; height: 32px; border: none; border-radius: 8px;
  background: none; color: var(--text-secondary);
  font-size: 16px; font-weight: bold; cursor: pointer;
  transition: all 0.2s; display: flex; align-items: center; justify-content: center;
}

/* 【新增】菜单触发按钮的悬停和激活状态 */
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--border-color);
  color: var(--text-primary);
}

/* 【新增】下拉菜单面板样式 */
.settings-dropdown-panel {
  position: absolute; top: calc(100% + 5px); right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px; padding: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 11; border: 1px solid var(--border-color);
  display: flex; overflow: hidden;
}

/* 【新增】下拉菜单中的列容器 */
.dropdown-column {
  display: flex; flex-direction: column;
}

/* 【新增】为非首列的列添加左边框作为分隔线 */
.dropdown-column:not(:first-child) {
  border-left: 1px solid var(--border-color);
}

/* 【新增】菜单选项按钮样式 */
.menu-option-btn {
  height: 30px; display: flex; align-items: center; justify-content: center;
  border: none; background: var(--bg-secondary); color: var(--text-primary);
  padding: 0 14px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background-color 0.2s;
  white-space: nowrap; border-bottom: 1px solid var(--border-color);
  border-radius: 0;
}

/* 【新增】菜单选项中删除按钮的特定颜色 */
.menu-option-btn.delete {
  color: #f44336;
}
/* 【新增】删除按钮悬停效果 */
.menu-option-btn.delete:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

/* 【新增】移除列中最后一个按钮的下边框 */
.dropdown-column .menu-option-btn:last-child {
  border-bottom: none;
}

/* 【新增】菜单选项按钮悬停效果 */
.menu-option-btn:hover {
  background: var(--bg-quaternary);
}

/* 【新增】菜单选项激活状态 */
.menu-option-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}

/* ========== 框选矩形样式 ========== */
.marquee-select-box {
  position: fixed; /* 固定定位 */
  background-color: rgba(76, 175, 80, 0.2); /* 半透明绿色背景 */
  border: 2px solid var(--green-primary); /* 绿色边框 */
  z-index: 9998; /* 高层级 */
  pointer-events: none; /* 不响应鼠标事件 */
}

/* ========== 交互提示与动画 ========== */

/* 提示浮层的通用样式 */
.operation-hint,
.copy-confirm-hint,
.delete-confirm-hint {
  position: fixed; padding: 6px 12px; border-radius: 6px;
  font-size: 14px; font-weight: 500; white-space: nowrap;
  pointer-events: none; z-index: 9999; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transform: translateY(-50%);
}

/* 操作快捷键提示浮层样式 */
.operation-hint { background: var(--bg-tertiary); opacity: 0.9; }
.hint-content { display: flex; flex-direction: column; gap: 2px; }
.hint-item { display: flex; justify-content: space-between; gap: 12px; }
.hint-key { color: var(--text-secondary); }
.hint-action { color: var(--text-primary); }
.hint-item:last-child .hint-action { color: #ff7575; }

/* 确认复制/删除的提示浮层样式 */
.copy-confirm-hint { background: var(--green-primary); color: #fff; }
.delete-confirm-hint { background: #d32f2f; color: #fff; }

/* 提示浮层的淡入淡出过渡效果 */
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

/* 等待确认操作时的脉冲动画 */
@keyframes pulse-animation {
  50% {
    background-color: var(--pulse-bg-color);
    border-color: var(--pulse-border-color);
    box-shadow: 0 0 20px 2px var(--pulse-shadow-color);
  }
}

/* 等待复制的条目应用脉冲动画 */
.event-container.pending-copy {
  --pulse-bg-color: rgba(76, 175, 80, 0.1);
  --pulse-border-color: rgba(76, 175, 80, 0.5);
  --pulse-shadow-color: rgba(76, 175, 80, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
  border: 1px solid transparent;
}

/* 等待删除的条目应用脉冲动画 */
.event-container.pending-delete {
  --pulse-bg-color: rgba(244, 67, 54, 0.1);
  --pulse-border-color: rgba(244, 67, 54, 0.5);
  --pulse-shadow-color: rgba(244, 67, 54, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
  border: 1px solid transparent;
}

/* 等待复制的条目内文字颜色变化 */
.event-container.pending-copy :deep(div),
.event-container.pending-copy :deep(strong),
.event-container.pending-copy :deep(.combo-num) {
  color: var(--green-secondary) !important;
}

/* 等待删除的条目内文字颜色变化 */
.event-container.pending-delete :deep(div),
.event-container.pending-delete :deep(strong),
.event-container.pending-delete :deep(.combo-num) {
  color: #f44336 !important;
}
</style>
